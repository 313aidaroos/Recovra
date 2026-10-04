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

export async function ensureOwnerWorkspace(input: {
  email: string | null | undefined;
  rpc: (name: "ensure_recovra_owner_account") => Promise<{ data: OwnerBootstrapResult; error: { message: string } | null }>;
}) {
  if (!isRecovraOwnerEmail(input.email)) return { attempted: false as const };
  const { data, error } = await input.rpc("ensure_recovra_owner_account");
  if (error) return { attempted: true as const, ok: false as const, error: error.message };
  return { attempted: true as const, ok: true as const, organizationId: data?.organization_id ?? null };
}
