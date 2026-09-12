import { Building2, KeyRound, ShieldCheck, Users } from "lucide-react";
import type { LiveWorkspace } from "@/lib/auth/workspace";
import type { MemberListItem } from "@/lib/db/resources";
import { formatDate, formatMoney } from "@/lib/format";
import { ADMIN_ROLES, APPROVER_ROLES, WRITER_ROLES } from "@/types/workspace";
import { PageHeader } from "../ui/page-header";
import { StatusBadge } from "../ui/status-badge";
import { FormStatus } from "../auth/form-status";
import { AddMemberForm, OrganizationForm } from "./settings-forms";

export function SettingsPanel({ workspace, members, savedMessage = null }: { workspace: LiveWorkspace; members: MemberListItem[]; savedMessage?: string | null }) {
  const { organization, role } = workspace;
  const isAdmin = ADMIN_ROLES.includes(role);

  return (
    <>
      <PageHeader eyebrow="Workspace administration" title="Settings" description="Organization profile, members, roles and the approval controls enforced on every recovery."/>
      <section className="settings-layout">
        <nav className="panel settings-nav">
          <a className="active" href="#organization"><Building2 size={16}/> Organization</a>
          <a href="#members"><Users size={16}/> Members & roles</a>
          <a href="#approvals"><ShieldCheck size={16}/> Approval policies</a>
          <a href="#security"><KeyRound size={16}/> Security</a>
        </nav>
        <div className="settings-stack">
          <article className="panel settings-form" id="organization">
            <div className="panel-title-row"><div><span className="panel-kicker">Organization profile</span><h3>{organization.name}</h3></div><StatusBadge tone="good">Live workspace</StatusBadge></div>
            {savedMessage && <FormStatus state={{ message: savedMessage }}/>}
            <OrganizationForm key={`${organization.name}|${organization.currency}|${organization.review_threshold}`} organization={organization} disabled={!isAdmin}/>
            {!isAdmin && <p className="muted-note">Only owners and admins can change organization settings. Your role: {role}.</p>}
          </article>

          <article className="panel settings-form" id="members">
            <div className="panel-title-row"><div><span className="panel-kicker">Members & roles</span><h3>{members.length} member{members.length === 1 ? "" : "s"}</h3></div></div>
            <div className="table-wrap"><table><thead><tr><th>Member</th><th>Role</th><th>Permissions</th><th>Joined</th></tr></thead><tbody>
              {members.map((member) => (
                <tr key={member.userId}>
                  <td><strong>{member.fullName || member.email || member.userId.slice(0, 8)}</strong>{member.fullName && <small className="cell-sub">{member.email}</small>}</td>
                  <td><StatusBadge tone={member.role === "owner" ? "good" : "neutral"}>{member.role}</StatusBadge></td>
                  <td><span className="muted">{[ADMIN_ROLES.includes(member.role) && "manage", APPROVER_ROLES.includes(member.role) && "approve", WRITER_ROLES.includes(member.role) && "ingest", "view"].filter(Boolean).join(" · ")}</span></td>
                  <td>{formatDate(member.joinedAt)}</td>
                </tr>
              ))}
            </tbody></table></div>
            {isAdmin ? (
              <>
                <p className="muted-note">Teammates must create a Recovra account first; then add them here by email.</p>
                <AddMemberForm/>
              </>
            ) : <p className="muted-note">Owners and admins can add members.</p>}
          </article>

          <article className="panel settings-form" id="approvals">
            <div className="panel-title-row"><div><span className="panel-kicker">Approval policies</span><h3>Human control over money</h3></div></div>
            <div className="approval-policy"><ShieldCheck size={19}/><div><strong>Human approval is required</strong><p>Only owner, admin and finance roles can approve a claim, and they must confirm evidence was reviewed. Recovra never submits claims or changes vendor accounts itself.</p></div><StatusBadge tone="good">Enforced</StatusBadge></div>
            <div className="approval-policy"><ShieldCheck size={19}/><div><strong>Review threshold</strong><p>Findings at or above {formatMoney(organization.review_threshold ?? "1000", organization.currency)} are highlighted for controller review before a claim is prepared.</p></div><StatusBadge tone="neutral">Configurable</StatusBadge></div>
            <div className="approval-policy"><ShieldCheck size={19}/><div><strong>Unverified variance is never counted as found</strong><p>Findings marked “needs review” (charges with no contract term, missing activity data) are reported separately and cannot be approved until verified.</p></div><StatusBadge tone="good">Enforced</StatusBadge></div>
          </article>

          <article className="panel settings-form" id="security">
            <div className="panel-title-row"><div><span className="panel-kicker">Security</span><h3>Tenant isolation</h3></div></div>
            <div className="guardrail-list">
              <div><ShieldCheck size={15}/><div><strong>Row-level security on every table</strong><small>Postgres policies scope each query to organizations you belong to; the app never uses a service-role key.</small></div></div>
              <div><ShieldCheck size={15}/><div><strong>Private document storage</strong><small>Files are stored under your organization’s folder and served only through short-lived signed URLs.</small></div></div>
              <div><ShieldCheck size={15}/><div><strong>Audit log</strong><small>Every upload, audit, approval and membership change is written to an append-only log with the acting user.</small></div></div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
