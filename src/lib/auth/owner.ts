import { OWNER_EMAIL } from "./redirects";

type OwnerBootstrapResult = { status?: string; organization_id?: string } | null;

export function isRecovraOwnerEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase() === OWNER_EMAIL;
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
