"use server";

import { requireLiveWorkspace } from "@/lib/auth/workspace";

export interface WalletRedeemState {
  status?: "pending" | "success" | "error";
  message?: string;
  reservationId?: string;
}

/**
 * Stub: Redeem Ixis for Recovra plan subscription.
 * Real implementation will call ApixisWallet APIs:
 * POST /api/v1/quotes → /reservations → capture/release → entitlement
 */
export async function redeemIxisAction(_previous: WalletRedeemState, formData: FormData): Promise<WalletRedeemState> {
  try {
    await requireLiveWorkspace();

    const planName = String(formData.get("plan") ?? "").trim();
    const ixisAmount = parseInt(String(formData.get("ixis_amount") ?? "0"), 10);

    if (!planName || ixisAmount <= 0) {
      return { status: "error", message: "Invalid plan or amount." };
    }

    // TODO: Integration with ApixisWallet
    // 1. POST /api/v1/quotes { sku: "recovery-intelligence-seat", quantity: 1 }
    // 2. POST /api/v1/reservations { quote_id, user_id, org_id }
    // 3. POST /api/v1/reservations/:id/capture
    // 4. On success: store entitlement in recovra DB
    // 5. On failure: POST /api/v1/reservations/:id/release

    // For now, return pending state until Wallet publishes INTEGRATION.md
    return {
      status: "pending",
      message: "Wallet connecting… Integration with ApixisWallet in progress. Please check back soon.",
      reservationId: undefined,
    };
  } catch (err) {
    console.error("Ixis redeem error:", err);
    return { status: "error", message: "Failed to process redemption. Try again later." };
  }
}
