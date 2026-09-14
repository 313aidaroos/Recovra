import { Bell, Building2, KeyRound, ShieldCheck, Users } from "lucide-react";
import { SettingsPanel } from "@/components/live/settings-panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getWorkspace } from "@/lib/auth/workspace";
import { loadMembers } from "@/lib/db/resources";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const workspace = await getWorkspace();
  if (workspace.mode === "live") {
    const [members, { saved }] = await Promise.all([loadMembers(workspace), searchParams]);
    return <SettingsPanel workspace={workspace} members={members} savedMessage={saved === "organization" ? "Organization settings saved." : null}/>;
  }
  return (
    <>
      <PageHeader eyebrow="Workspace administration" title="Settings" description="Manage organization access, approvals, notifications, and security controls."/>
      <section className="settings-layout">
        <nav className="panel settings-nav"><button className="active"><Building2 size={16}/> Organization</button><button><Users size={16}/> Members & roles</button><button><ShieldCheck size={16}/> Approval policies</button><button><Bell size={16}/> Notifications</button><button><KeyRound size={16}/> Security</button></nav>
        <article className="panel settings-form">
          <div className="panel-title-row"><div><span className="panel-kicker">Organization profile</span><h3>Acme Holdings</h3></div><StatusBadge tone="neutral">Sample workspace</StatusBadge></div>
          <label>Organization name<input defaultValue="Acme Holdings"/></label>
          <label>Primary currency<select defaultValue="USD"><option>USD — United States Dollar</option><option>EUR — Euro</option><option>GBP — Pound Sterling</option></select></label>
          <label>Financial review threshold<select defaultValue="1000"><option value="1000">$1,000 and above</option><option value="5000">$5,000 and above</option><option value="10000">$10,000 and above</option></select></label>
          <div className="approval-policy"><ShieldCheck size={19}/><div><strong>Human approval is required</strong><p>Claims cannot be submitted and vendor account changes cannot be made without an authorized reviewer.</p></div><StatusBadge tone="good">Enforced</StatusBadge></div>
          <button className="primary-button">Save changes</button>
        </article>
      </section>
    </>
  );
}
