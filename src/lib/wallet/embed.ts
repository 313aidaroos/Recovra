/**
 * Provisional Apixis Wallet buy deep link.
 *
 * docs/WALLET_EMBED.md is still landing on the Wallet buy-UX change.
 * Until that contract is published, Recovra sends the params Wallet
 * already needs to attribute the buyer and send them home:
 * - view=buy — matches the live wallet surface key (`buy`)
 * - origin=recovra — product slug
 * - return_url — production Recovra path only (Wallet allowlist)
 *
 * Cash is charged only on Apixis Wallet (Stripe webhook). Recovra
 * never opens its own Checkout to sell Ixis.
 */

export const APIXIS_WALLET_ORIGIN = "https://apixis-wallet.vercel.app";

/** Production host from docs/OPERATIONS.md and docs/LAUNCH_CHECKLIST.md. */
export const RECOVRA_PUBLIC_ORIGIN = "https://recovra-three.vercel.app";

export const WALLET_PRODUCT_ORIGIN = "recovra";

export const WALLET_RETURN_PATHS = ["/pricing", "/dashboard", "/settings"] as const;

export type WalletReturnPath = (typeof WALLET_RETURN_PATHS)[number];

const ALLOWED_RETURN_PATHS = new Set<string>(WALLET_RETURN_PATHS);

export function apixisWalletBuyUrl(returnPath: WalletReturnPath): string {
  if (!ALLOWED_RETURN_PATHS.has(returnPath)) {
    throw new Error("Wallet return path is not allowlisted.");
  }

  const returnUrl = new URL(returnPath, RECOVRA_PUBLIC_ORIGIN);
  if (returnUrl.origin !== RECOVRA_PUBLIC_ORIGIN) {
    throw new Error("Wallet return URL must stay on the Recovra production host.");
  }

  const url = new URL(APIXIS_WALLET_ORIGIN);
  url.searchParams.set("view", "buy");
  url.searchParams.set("origin", WALLET_PRODUCT_ORIGIN);
  url.searchParams.set("return_url", returnUrl.toString());
  return url.toString();
}
