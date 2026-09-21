import { describe, expect, it } from "vitest";
import { APIXIS_WALLET_ORIGIN, RECOVRA_PUBLIC_ORIGIN, WALLET_PRODUCT_ORIGIN, apixisWalletBuyUrl } from "./embed";

describe("apixisWalletBuyUrl", () => {
  it("opens the Apixis Wallet buy surface with origin and an allowlisted return", () => {
    const href = apixisWalletBuyUrl("/pricing");
    const url = new URL(href);

    expect(url.origin).toBe(APIXIS_WALLET_ORIGIN);
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("view")).toBe("buy");
    expect(url.searchParams.get("origin")).toBe(WALLET_PRODUCT_ORIGIN);
    expect(url.searchParams.get("return_url")).toBe(`${RECOVRA_PUBLIC_ORIGIN}/pricing`);
    expect(href).not.toMatch(/stripe|checkout/i);
  });

  it("keeps dashboard and settings returns on the production host", () => {
    expect(new URL(apixisWalletBuyUrl("/dashboard")).searchParams.get("return_url")).toBe(`${RECOVRA_PUBLIC_ORIGIN}/dashboard`);
    expect(new URL(apixisWalletBuyUrl("/settings")).searchParams.get("return_url")).toBe(`${RECOVRA_PUBLIC_ORIGIN}/settings`);
  });
});
