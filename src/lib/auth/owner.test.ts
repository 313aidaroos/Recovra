import { describe, expect, it } from "vitest";
import { ensureOwnerWorkspace, isRecovraOwnerEmail } from "./owner";

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
