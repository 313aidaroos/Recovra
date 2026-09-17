import { describe, expect, it } from "vitest";
import { getCixySystemPrompt } from "./prompt";

describe("getCixySystemPrompt", () => {
  it("includes Cixy identity (Muslim, honest, modest)", () => {
    const prompt = getCixySystemPrompt({
      organizationName: "Test Corp",
      tenantId: "org-1",
    });
    expect(prompt).toContain("Muslim");
    expect(prompt).toContain("As-salamu alaykum");
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

  it("includes halal-conscious guardrails", () => {
    const prompt = getCixySystemPrompt({
      organizationName: "Test Corp",
      tenantId: "org-1",
    });
    expect(prompt).toContain("halal");
    expect(prompt).toContain("never recommend");
    expect(prompt).toContain("alcohol");
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
