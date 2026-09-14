import { redirect } from "next/navigation";
import { AppShell, type ShellWorkspace } from "@/components/app-shell";
import { getWorkspace } from "@/lib/auth/workspace";
import { initials } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const workspace = await getWorkspace();
  if (workspace.mode === "onboarding") redirect("/onboarding");

  let shell: ShellWorkspace;
  if (workspace.mode === "live") {
    const { data } = await workspace.supabase
      .from("notifications")
      .select("id, title, body, kind, entity_type, entity_id, created_at")
      .eq("organization_id", workspace.organization.id)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(6);
    shell = {
      mode: "live",
      organizationName: workspace.organization.name,
      organizations: workspace.memberships.map((membership) => ({ id: membership.organization.id, name: membership.organization.name })),
      activeOrganizationId: workspace.organization.id,
      role: workspace.role,
      userEmail: workspace.user.email,
      userInitials: initials(workspace.user.fullName || workspace.user.email),
      notifications: ((data ?? []) as Array<{ id: string; title: string; body: string | null; kind: string; entity_type: string | null; entity_id: string | null }>).map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body ?? "",
        href: row.entity_type === "finding" && row.entity_id ? `/opportunities/${row.entity_id}` : "/recoveries",
        tone: row.kind === "approval_requested" ? "warn" : "info",
      })),
    };
  } else {
    shell = { mode: "demo", canSignIn: isSupabaseConfigured() };
  }

  return <AppShell workspace={shell}>{children}</AppShell>;
}
