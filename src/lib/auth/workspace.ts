import { cookies } from "next/headers";
import { cache } from "react";
import { createServerSupabase, type ServerSupabase } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Membership, Organization, OrganizationRole, WorkspaceUser } from "@/types/workspace";

export const ACTIVE_ORG_COOKIE = "recovra-org";

/**
 * Demo: anonymous visitor (or Supabase not configured) → clearly labelled sample workspace.
 * Onboarding: signed in but not a member of any organization yet.
 * Live: signed in with an active organization; all data comes from the tenant's own rows.
 */
export type WorkspaceContext =
  | { mode: "demo"; configured: boolean }
  | { mode: "onboarding"; user: WorkspaceUser; supabase: ServerSupabase }
  | {
      mode: "live";
      user: WorkspaceUser;
      organization: Organization;
      role: OrganizationRole;
      memberships: Membership[];
      supabase: ServerSupabase;
    };

export type LiveWorkspace = Extract<WorkspaceContext, { mode: "live" }>;

type MembershipRow = {
  role: OrganizationRole;
  organization: Organization | Organization[] | null;
};

export const getWorkspace = cache(async (): Promise<WorkspaceContext> => {
  if (!isSupabaseConfigured()) return { mode: "demo", configured: false };
  const supabase = await createServerSupabase();
  if (!supabase) return { mode: "demo", configured: false };

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { mode: "demo", configured: true };

  const user: WorkspaceUser = {
    id: auth.user.id,
    email: auth.user.email ?? "",
    fullName: (auth.user.user_metadata?.full_name as string | undefined) ?? "",
  };

  const { data: rows } = await supabase
    .from("organization_members")
    .select("role, organization:organizations(id, name, slug, currency, review_threshold)")
    .order("created_at", { ascending: true });

  const memberships: Membership[] = ((rows ?? []) as MembershipRow[])
    .map((row) => {
      const organization = Array.isArray(row.organization) ? row.organization[0] : row.organization;
      return organization ? { role: row.role, organization } : null;
    })
    .filter((row): row is Membership => row !== null);

  if (memberships.length === 0) return { mode: "onboarding", user, supabase };

  const cookieStore = await cookies();
  const preferred = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const active = memberships.find((membership) => membership.organization.id === preferred) ?? memberships[0];

  return { mode: "live", user, organization: active.organization, role: active.role, memberships, supabase };
});

export class WorkspaceAccessError extends Error {
  constructor(message = "You do not have permission to perform this action.") {
    super(message);
    this.name = "WorkspaceAccessError";
  }
}

export async function requireLiveWorkspace(allowedRoles?: OrganizationRole[]): Promise<LiveWorkspace> {
  const workspace = await getWorkspace();
  if (workspace.mode !== "live") throw new WorkspaceAccessError("Sign in and select an organization first.");
  if (allowedRoles && !allowedRoles.includes(workspace.role)) {
    throw new WorkspaceAccessError(`This action requires one of these roles: ${allowedRoles.join(", ")}.`);
  }
  return workspace;
}

export async function writeAuditLog(
  workspace: LiveWorkspace,
  action: string,
  entity: { type: string; id: string },
  metadata: Record<string, unknown> = {},
) {
  await workspace.supabase.from("audit_logs").insert({
    organization_id: workspace.organization.id,
    actor_user_id: workspace.user.id,
    action,
    entity_type: entity.type,
    entity_id: entity.id,
    metadata,
  });
}
