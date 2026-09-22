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

    // Product key must match ApixisWallet catalog exactly
    const productKey = "recovery-intelligence-seat"; // 22,000 Ixis/mo
    
    // Unique idempotency key per attempt (include timestamp)
    const idempotencyKey = `recovra-${workspace.organization.id}-${planName}-${Date.now()}`;

    const result = await redeem({
      ownerEmail,
      productKey,
      idempotencyKey,
      provision: async (reservation) => {
        // TODO: Store entitlement in Recovra DB
        // For now, just return the reservation as proof
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
      return { status: "error", message: err.message };
    }
    return { status: "error", message: "Failed to process redemption. Try again later." };
  }
}
