import { describe, expect, it } from "vitest";
import { ensureOwnerWorkspace, isProvenOwner, isRecovraOwnerEmail } from "./owner";

describe("isRecovraOwnerEmail", () => {
  it("recognizes awad@apixis.dev case-insensitively", () => {
    expect(isRecovraOwnerEmail(" Awad@Apixis.Dev ")).toBe(true);
  });

  it("does not grant ownership to other addresses", () => {
    expect(isRecovraOwnerEmail("awad@recovra.com")).toBe(false);
  });
});

describe("ensureOwnerWorkspace", () => {
  it("calls the owner bootstrap rpc only for the configured owner", async () => {
    const calls: string[] = [];
    const result = await ensureOwnerWorkspace({
      email: "awad@apixis.dev",
      rpc: async (name) => {
        calls.push(name);
        return { data: { status: "ok", organization_id: "org-1" }, error: null };
      },
    });
    expect(calls).toEqual(["ensure_recovra_owner_account"]);
    expect(result).toEqual({ attempted: true, ok: true, organizationId: "org-1" });
  });

  it("skips bootstrap for non-owner emails", async () => {
    const result = await ensureOwnerWorkspace({
      email: "customer@example.com",
      rpc: async () => {
        throw new Error("should not call");
      },
    });
    expect(result).toEqual({ attempted: false });
  });
});

describe("owner admin allowlist", () => {
  it("recognizes both owner emails case-insensitively", () => {
    expect(isRecovraOwnerEmail("ALAIDAROOSAWAD@gmail.com")).toBe(true);
    expect(isRecovraOwnerEmail(" awad@apixis.dev")).toBe(true);
    expect(isRecovraOwnerEmail("")).toBe(false);
  });
});

describe("isProvenOwner", () => {
  const jwt = (amr: unknown) =>
    `x.${Buffer.from(JSON.stringify({ amr })).toString("base64url")}.y`;
  const owner = { email: "awad@apixis.dev", email_confirmed_at: "2026-10-04T00:00:00Z" };

  it("needs a confirmed owner email and an email-proving sign-in", () => {
    expect(isProvenOwner(owner, jwt([{ method: "otp" }]))).toBe(true);
    expect(isProvenOwner(owner, jwt([{ method: "password" }]))).toBe(false);
    expect(isProvenOwner({ ...owner, email_confirmed_at: null }, jwt([{ method: "otp" }]))).toBe(false);
    expect(isProvenOwner({ ...owner, email: "x@example.com" }, jwt([{ method: "otp" }]))).toBe(false);
  });
});
