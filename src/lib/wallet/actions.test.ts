import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  user: { id: "local-user", email: "owner@example.com", email_confirmed_at: "2026-09-30", app_metadata: {} },
  rpc: vi.fn(), redeem: vi.fn(), serviceReady: true,
}));
vi.mock("@/lib/supabase/server", () => ({ createServerSupabase: async () => ({ auth: { getUser: async () => ({ data: { user: mocks.user } }) } }) }));
vi.mock("@/lib/supabase/service", () => ({ createServiceSupabase: () => mocks.serviceReady ? { rpc: mocks.rpc } : null }));
vi.mock("@/lib/auth/workspace", () => ({ requireLiveWorkspace: async () => ({ user: mocks.user, organization: { id: "org-1" } }) }));
vi.mock("@/lib/apixis-wallet", async importOriginal => ({ ...(await importOriginal<object>()), redeem: mocks.redeem }));
import { redeemIxisAction } from "./actions";
function form() { const f=new FormData(); f.set("plan","Starter"); f.set("attemptId","attempt-1234567890"); return f; }
beforeEach(() => { vi.clearAllMocks(); mocks.serviceReady=true; mocks.rpc.mockResolvedValue({error:null}); mocks.redeem.mockResolvedValue({ok:true,receiptId:"transaction-1",result:"reservation-1"}); });
describe("paid plan activation", () => {
  it("does not reserve with a missing service client", async () => {
    mocks.serviceReady=false;
    expect((await redeemIxisAction({},form())).status).toBe("error");
    expect(mocks.redeem).not.toHaveBeenCalled();
  });
  it("does not alter access when capture fails", async () => {
    mocks.redeem.mockRejectedValue(new Error("capture uncertain"));
    expect((await redeemIxisAction({},form())).status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("activates using the stable reservation only after confirmed payment", async () => {
    expect((await redeemIxisAction({},form())).status).toBe("success");
    const args=mocks.redeem.mock.calls[0][0];
    expect(await args.provision({reservationId:"reservation-1"})).toBe("reservation-1");
    expect(args.unprovision).toBeUndefined();
    expect(mocks.rpc).toHaveBeenCalledWith("activate_paid_plan_as_service",expect.objectContaining({p_receipt:"reservation-1"}));
  });
  it("keeps the same purchase identity when activation needs retry", async () => {
    mocks.rpc.mockResolvedValueOnce({error:{code:"503"}});
    const first=await redeemIxisAction({},form());
    expect(first.message).toContain("Payment was confirmed");
    await redeemIxisAction(first,form());
    expect(mocks.redeem.mock.calls[0][0].idempotencyKey).toBe(mocks.redeem.mock.calls[1][0].idempotencyKey);
  });
  it("rejects an absent attempt before any Wallet call",async()=>{
    const f=form();f.delete("attemptId");
    expect((await redeemIxisAction({},f)).status).toBe("error");
    expect(mocks.redeem).not.toHaveBeenCalled();
  });
});
