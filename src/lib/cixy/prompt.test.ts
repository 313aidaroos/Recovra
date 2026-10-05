import { describe, expect, it } from "vitest";
import { getCixySystemPrompt } from "./prompt";
import { CIXY_CORE } from "@/lib/apixis-cixy";

describe("getCixySystemPrompt", () => {
  it("includes Cixy identity (honest, modest) from the shared core", () => {
    const prompt = getCixySystemPrompt({
      organizationName: "Test Corp",
      tenantId: "org-1",
    });
    expect(prompt).toContain(CIXY_CORE);
    expect(prompt).toContain("honest");
  });

  it("includes recovery domain expertise", () => {
    const prompt = getCixySystemPrompt({
      organizationName: "Test Corp",
      tenantId: "org-1",
    });
    expect(prompt).toContain("overcharge");
    expect(prompt).toContain("audit");
    expect(prompt).toContain("savings");
  });

  it("has no religious content outside Halaxis (Awad lock 2026-10-04)", () => {
    const prompt = getCixySystemPrompt({
      organizationName: "Test Corp",
      tenantId: "org-1",
    });
    expect(prompt).not.toMatch(
      /salaam|salam|insha|alhamdulillah|bismillah|halal|haram|prayer|ramadan|hijri|\beid\b|muslim|scholar|fatwa|riba|alcohol|pork|gambl/i,
    );
    expect(prompt).toContain("harmful, deceptive or illegal");
  });

  it("does not fabricate savings amounts", () => {
    const prompt = getCixySystemPrompt({
      organizationName: "Test Corp",
      tenantId: "org-1",
    });
    expect(prompt).toContain("never fabricate");
    expect(prompt).toContain("evidence");
  });

  it("includes tenant isolation reminder", () => {
    const prompt = getCixySystemPrompt({
      organizationName: "Test Corp",
      tenantId: "org-1",
    });
    expect(prompt).toContain("org-1");
    expect(prompt).toContain("only");
  });
});
