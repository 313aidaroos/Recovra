export const SUPPORT_INBOX = "recovra@apixis.dev";
export const SUPPORT_ROUTE_TO = "awad@apixis.dev";

export const SUPPORT_CATEGORIES = [
  "billing_audit",
  "document_upload",
  "recovery_workflow",
  "account_access",
  "security",
  "general",
] as const;

export type SupportCategory = (typeof SUPPORT_CATEGORIES)[number];

export type SupportRequestInput = {
  name?: unknown;
  email?: unknown;
  company?: unknown;
  category?: unknown;
  subject?: unknown;
  message?: unknown;
};

export type ValidSupportRequest = {
  name: string;
  email: string;
  company: string;
  category: SupportCategory;
  subject: string;
  message: string;
  inbox: typeof SUPPORT_INBOX;
  routeTo: typeof SUPPORT_ROUTE_TO;
};

export type SupportValidationResult =
  | { ok: true; value: ValidSupportRequest }
  | { ok: false; errors: Partial<Record<keyof SupportRequestInput, string>> };

function clean(value: unknown, max: number) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max + 1);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function category(value: unknown): SupportCategory {
  const cleaned = clean(value, 80) as SupportCategory;
  return SUPPORT_CATEGORIES.includes(cleaned) ? cleaned : "general";
}

export function validateSupportRequest(input: SupportRequestInput): SupportValidationResult {
  const name = clean(input.name, 120);
  const email = clean(input.email, 254).toLowerCase();
  const company = clean(input.company, 160);
  const subject = clean(input.subject, 200);
  const message = String(input.message ?? "").trim();

  const errors: Partial<Record<keyof SupportRequestInput, string>> = {};
  if (name.length < 2 || name.length > 120) errors.name = "Enter your name.";
  if (!isEmail(email) || email.length > 254) errors.email = "Enter a valid email.";
  if (company.length > 160) errors.company = "Company is too long.";
  if (subject.length < 3 || subject.length > 200) errors.subject = "Enter a subject under 200 characters.";
  if (message.length < 20 || message.length > 4000) errors.message = "Message must be 20–4000 characters.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: {
      name,
      email,
      company,
      category: category(input.category),
      subject,
      message,
      inbox: SUPPORT_INBOX,
      routeTo: SUPPORT_ROUTE_TO,
    },
  };
}
