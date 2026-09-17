import { describe, expect, it } from "vitest";
import { SUPPORT_ROUTE_TO, validateSupportRequest } from "./validate";

const good = {
  name: "Awad A",
  email: "customer@example.com",
  company: "Example Freight",
  category: "billing_audit",
  subject: "Duplicate invoice question",
  message: "We think NSP-884103 was paid twice. Can you check the evidence?",
};

describe("validateSupportRequest", () => {
  it("accepts a complete request and normalises fields", () => {
    const result = validateSupportRequest({ ...good, email: "  Customer@Example.com " });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.email).toBe("customer@example.com");
    expect(result.value.routeTo).toBe(SUPPORT_ROUTE_TO);
    expect(result.value.category).toBe("billing_audit");
  });

  it("requires a valid email", () => {
    const result = validateSupportRequest({ ...good, email: "nope" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.email).toMatch(/email/i);
  });

  it("requires a message of at least 20 characters", () => {
    const result = validateSupportRequest({ ...good, message: "too short" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.message).toBeTruthy();
  });

  it("caps field lengths", () => {
    const result = validateSupportRequest({ ...good, subject: "x".repeat(201) });
    expect(result.ok).toBe(false);
  });

  it("falls back to the general category for unknown values", () => {
    const result = validateSupportRequest({ ...good, category: "hax" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.category).toBe("general");
  });

  it("routes every request to the owner inbox", () => {
    expect(SUPPORT_ROUTE_TO).toBe("awad@apixis.dev");
  });
});
