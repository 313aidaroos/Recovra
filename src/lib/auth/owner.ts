import { OWNER_ADMIN_EMAILS } from "./redirects";

type OwnerBootstrapResult = { status?: string; organization_id?: string } | null;

export function recovraOwnerEmails(env: string | undefined = process.env.ADMIN_EMAILS): Set<string> {
  const list = new Set<string>(OWNER_ADMIN_EMAILS);
  for (const raw of String(env ?? "").split(",")) {
    const email = raw.trim().toLowerCase();
    if (email.includes("@")) list.add(email);
  }
  return list;
}

/** Owner admin allowlist, case-insensitive. The DB (ensure_recovra_owner_account, support RLS) checks the same two addresses. */
export function isRecovraOwnerEmail(email: string | null | undefined) {
  const normalized = (email ?? "").trim().toLowerCase();
  return Boolean(normalized) && recovraOwnerEmails().has(normalized);
}

// Some sign-ups on this project are auto-confirmed, so email_confirmed_at alone does not prove the
// address. The owner bypass also needs a session whose `amr` shows an email-proving sign-in.
const EMAIL_PROVING_AMR = new Set(["otp", "magiclink", "oauth", "sso/saml", "recovery", "invite", "email_change"]);

export function amrProvesEmail(accessToken: string | null | undefined): boolean {
  if (!accessToken) return false;
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString("utf8"));
    const amr: unknown[] = Array.isArray(payload?.amr) ? payload.amr : [];
    return amr.some((entry) => {
      const method = typeof entry === "string" ? entry : (entry as { method?: unknown } | null)?.method;
      return typeof method === "string" && EMAIL_PROVING_AMR.has(method);
    });
  } catch {
    return false;
  }
}

/** Owner bypass (Awad, 2026-10-04): confirmed owner email + email-proving sign-in. Product gates only. */
export function isProvenOwner(
  user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined,
  accessToken: string | null | undefined,
): boolean {
  return Boolean(user?.email_confirmed_at) && isRecovraOwnerEmail(user?.email) && amrProvesEmail(accessToken);
}

export async function ensureOwnerWorkspace(input: {
  email: string | null | undefined;
  rpc: (name: "ensure_recovra_owner_account") => Promise<{ data: OwnerBootstrapResult; error: { message: string } | null }>;
}) {
  if (!isRecovraOwnerEmail(input.email)) return { attempted: false as const };
  const { data, error } = await input.rpc("ensure_recovra_owner_account");
  if (error) return { attempted: true as const, ok: false as const, error: error.message };
  return { attempted: true as const, ok: true as const, organizationId: data?.organization_id ?? null };
}
