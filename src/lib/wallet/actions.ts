"use server";

import { requireLiveWorkspace } from "@/lib/auth/workspace";
import { redeem, buyIxisUrl, WalletError } from "@/lib/apixis-wallet";

export interface WalletRedeemState {
  status?: "success" | "insufficient" | "error";
  message?: string;
  buyUrl?: string;
}

/**
 * Redeem Ixis for Recovra plan subscription.
 * Uses the shared Wallet client: reserve → provision → capture.
 */
export async function redeemIxisAction(_previous: WalletRedeemState, formData: FormData): Promise<WalletRedeemState> {
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

    // Unique idempotency key per attempt (include timestamp)
    const idempotencyKey = `recovra-${workspace.organization.id}-${planName}-${Date.now()}`;

    const result = await redeem({
      ownerEmail,
      productKey,
      idempotencyKey,
      provision: async (reservation) => {
        // Record the plan on the org while the Ixis are held. RLS-only project: goes through
        // grant_plan_entitlement (SECURITY DEFINER, member-checked). Throwing here releases the hold.
        const { error } = await workspace.supabase.rpc("grant_plan_entitlement", {
          p_org: workspace.organization.id,
          p_plan: sku.plan,
          p_product_key: productKey,
          p_receipt: reservation.reservationId,
        });
        if (error) throw new Error(`Could not record plan: ${error.message}`);
        return { subscribed: true, reservationId: reservation.reservationId };
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
