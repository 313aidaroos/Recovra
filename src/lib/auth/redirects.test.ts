import { describe, expect, it } from "vitest";
import { authCallbackTarget, magicLinkRedirect, safeNextPath } from "./redirects";

describe("safeNextPath", () => {
  it("keeps same-site paths", () => {
    expect(safeNextPath("/opportunities/abc")).toBe("/opportunities/abc");
  });
  it("rejects protocol-relative and absolute urls", () => {
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });
  it("accepts a custom fallback", () => {
    expect(safeNextPath(null, "/onboarding")).toBe("/onboarding");
  });
});

describe("magicLinkRedirect", () => {
  it("builds the callback url on the current origin with a safe next", () => {
    expect(magicLinkRedirect("https://recovra-three.vercel.app", "/support")).toBe("https://recovra-three.vercel.app/auth/callback?next=%2Fsupport");
  });
  it("falls back to dashboard for unsafe next", () => {
    expect(magicLinkRedirect("https://recovra-three.vercel.app", "//x")).toBe("https://recovra-three.vercel.app/auth/callback?next=%2Fdashboard");
  });
});

describe("authCallbackTarget", () => {
  it("routes a code exchange", () => {
    expect(authCallbackTarget(new URLSearchParams("code=abc&next=/dashboard"))).toEqual({ kind: "code", code: "abc", next: "/dashboard" });
  });
  it("routes a token_hash verification", () => {
    expect(authCallbackTarget(new URLSearchParams("token_hash=th&type=magiclink&next=/onboarding"))).toEqual({ kind: "token_hash", tokenHash: "th", type: "magiclink", next: "/onboarding" });
  });
  it("routes provider errors to login with a reason", () => {
    expect(authCallbackTarget(new URLSearchParams("error=access_denied&error_code=otp_expired"))).toEqual({ kind: "error", reason: "otp_expired" });
  });
  it("treats missing params as an error", () => {
    expect(authCallbackTarget(new URLSearchParams(""))).toEqual({ kind: "error", reason: "link_invalid" });
  });
  it("rejects unknown otp types", () => {
    expect(authCallbackTarget(new URLSearchParams("token_hash=th&type=weird"))).toEqual({ kind: "error", reason: "link_invalid" });
  });
});
