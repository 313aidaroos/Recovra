"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import { requireLiveWorkspace } from "@/lib/auth/workspace";
import { redeem, buyIxisUrl, WalletError } from "@/lib/apixis-wallet";
import { randomBytes } from "crypto";
import { apixisOwner } from "@/lib/apixis-login";
import { createServiceSupabase } from "@/lib/supabase/service";

export interface WalletRedeemState {
  status?: "success" | "insufficient" | "error";
  message?: string;
  buyUrl?: string;
}

/**
 * Redeem Ixis for Recovra plan subscription.
 * Uses the shared Wallet client: reserve → provision → capture (with unprovision on capture failure).
 */
export async function redeemIxisAction(_previous: WalletRedeemState, formData: FormData): Promise<WalletRedeemState> {
  // Family sign-in standard: a signed-out click on a gated button goes to /login?next=<here>,
  // and the magic link brings the user back to this exact page. Auth check runs before anything else.
  {
    const supabase = await createServerSupabase();
    const { data: { user } = { user: null } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
    if (!user) {
      const next = String(formData.get("next") ?? "/pricing");
      redirect(`/login?next=${encodeURIComponent(next.startsWith("/") && !next.startsWith("//") ? next : "/pricing")}`);
    }
  }
  try {
    const workspace = await requireLiveWorkspace();
    const ownerEmail = workspace.user.email;
    if (!ownerEmail) {
      return { status: "error", message: "No verified email on your account." };
    }

    const planName = String(formData.get("plan") ?? "").trim();
    const ixisAmount = parseInt(String(formData.get("ixis_amount") ?? "0"), 10);

    if (!planName || ixisAmount <= 0) {
      return { status: "error", message: "Invalid plan or amount." };
    }

    // Product keys must match ApixisWallet lib/catalog.ts exactly (verified live 2026-09-22).
    const PRODUCT_KEYS: Record<string, { key: string; plan: "starter" | "growth" }> = {
      Starter: { key: "recovra.intel.monthly", plan: "starter" },
      Growth: { key: "recovra.intel.growth", plan: "growth" },
    };
    const sku = PRODUCT_KEYS[planName];
    if (!sku) return { status: "error", message: "That plan can't be redeemed yet — contact us for Enterprise." };
    const productKey = sku.key;

    // BILLING HARDENING 3a: Idempotency key = user + product + client-generated attemptId per click.
    // NOT Date.now(). Under 80 chars, no email in it.
    const attemptId = String(formData.get("attemptId") ?? randomBytes(8).toString("hex"));
    const idempotencyKey = `recovra-${workspace.organization.id.slice(0, 8)}-${sku.plan}-${attemptId}`;
    if (idempotencyKey.length > 80) {
      return { status: "error", message: "Invalid attempt ID." };
    }

    const result = await redeem({
      owner: (await apixisOwner(ownerEmail)) ?? ownerEmail,
      productKey,
      idempotencyKey,
      provision: async (reservation) => {
        // Record the plan on the org while the Ixis are held. Server-only (service role): customers
        // can no longer grant themselves a plan. Throwing here releases the hold.
        const service = createServiceSupabase();
        if (!service) throw new Error("Plan activation is not configured (SUPABASE_SERVICE_ROLE_KEY).");
        const { error } = await service.rpc("grant_plan_entitlement_for", {
          p_org: workspace.organization.id,
          p_user: workspace.user.id,
          p_plan: sku.plan,
          p_product_key: productKey,
          p_receipt: reservation.reservationId,
        });
        if (error) throw new Error(`Could not record plan: ${error.message}`);
        return { org: workspace.organization.id, subscribed: true, reservationId: reservation.reservationId };
      },
      // BILLING HARDENING 3b: unprovision callback — if capture fails after provision, undo the access grant
      unprovision: async (_reservation, result) => {
        // Delete the plan_entitlements row via SECURITY DEFINER function
        const { error } = await workspace.supabase.rpc("revoke_plan_entitlement", {
          p_org: result.org,
        });
        if (error) {
          console.error("Failed to unprovision after capture failure:", error);
          // Log but don't throw — we already released the hold
        }
      },
    });

    if (!result.ok) {
      // 402: Not enough Ixis
      const returnUrl = `https://recovra-three.vercel.app/pricing`;
      return {
        status: "insufficient",
        message: `You need ${result.needed.toLocaleString()} Ixis. You can buy more and return here.`,
        buyUrl: buyIxisUrl("recovra", returnUrl),
      };
    }

    return {
      status: "success",
      message: `${planName} plan activated! Receipt: ${result.receiptId}`,
    };
  } catch (err) {
    console.error("Ixis redeem error:", err);
    if (err instanceof WalletError) {
      return { status: "error", message: `Wallet: ${err.message}` };
    }
    return { status: "error", message: err instanceof Error ? err.message : "Failed to process redemption. Nothing was charged." };
  }
}
