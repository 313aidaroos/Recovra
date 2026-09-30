"use server";
// Change note (Claude, Sep 2026): Calls the service-only grant/revoke. See docs/LAUNCH_NOTES.md.

import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceSupabase } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

import { requireLiveWorkspace } from "@/lib/auth/workspace";
import { redeem, buyIxisUrl, WalletError } from "@/lib/apixis-wallet";
import { createHash } from "node:crypto";
import { safeNextPath } from "@/lib/auth/redirects";

export interface WalletRedeemState {
  status?: "success" | "insufficient" | "error";
  message?: string;
  buyUrl?: string;
}

/**
 * Redeem Ixis for Recovra plan subscription.
 * Uses the shared Wallet client: reserve → confirm capture → idempotent plan activation.
 */
export async function redeemIxisAction(_previous: WalletRedeemState, formData: FormData): Promise<WalletRedeemState> {
  // Family sign-in standard: a signed-out click on a gated button goes to /login?next=<here>,
  // and the magic link brings the user back to this exact page. Auth check runs before anything else.
  const supabase = await createServerSupabase();
  const { data: { user } = { user: null } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!user) redirect(`/login?next=${encodeURIComponent(safeNextPath(formData.get("next"), "/pricing"))}`);
  if (!user.email || !user.email_confirmed_at) return { status: "error", message: "Verify your email before redeeming Ixis." };
  try {
    const workspace = await requireLiveWorkspace(["owner", "admin", "finance"]);
    const ownerEmail = workspace.user.email;
    if (!ownerEmail) {
      return { status: "error", message: "No verified email on your account." };
    }

    const planName = String(formData.get("plan") ?? "").trim();

    if (!planName) {
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
    const attemptId = String(formData.get("attemptId") ?? "");
    const idempotencyKey = `recovra-${createHash("sha256").update(`${workspace.organization.id}:${sku.plan}:${attemptId}`).digest("hex")}`;
    if (!/^[a-zA-Z0-9-]{16,64}$/.test(attemptId)) {
      return { status: "error", message: "Invalid attempt ID." };
    }

    // Plan grants are server-only (service role). Without the key, stop before touching the Wallet.
    const service = createServiceSupabase();
    if (!service) {
      return { status: "error", message: "Plan activation is not configured yet (server key missing). Nothing was charged." };
    }

    const result = await redeem({
      owner: typeof user.app_metadata?.apixis_sub === "string" ? user.app_metadata.apixis_sub : ownerEmail,
      productKey,
      idempotencyKey,
      // No paid access is changed until capture is confirmed. Replays reuse the
      // same reservation and the activation RPC records each receipt only once.
      provision: async (reservation) => reservation.reservationId,

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

    const { error: activationError } = await service.rpc("activate_paid_plan_as_service", {
      p_org: workspace.organization.id,
      p_user: workspace.user.id,
      p_plan: sku.plan,
      p_product_key: productKey,
      p_receipt: result.result,
    });
    if (activationError) {
      console.error("Paid plan activation needs retry", { reservationId: result.result, code: activationError.code });
      return { status: "error", message: "Payment was confirmed, but plan activation needs a retry. Use this same button again; this purchase will not be charged twice." };
    }

    return {
      status: "success",
      message: `${planName} plan activated! Receipt: ${result.receiptId}`,
    };
  } catch (err) {
    console.error("Ixis redeem error:", err);
    if (err instanceof WalletError) {
      return { status: "error", message: "The Wallet could not confirm the purchase. Retry this same purchase to check its status; do not start another payment." };
    }
    return { status: "error", message: "The purchase could not be completed. Retry this same purchase to check its status." };
  }
}
