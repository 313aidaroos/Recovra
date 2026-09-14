"use server";

import { revalidatePath } from "next/cache";
import { requireLiveWorkspace, WorkspaceAccessError, writeAuditLog } from "@/lib/auth/workspace";
import type { FindingRow, RecoveryRow } from "@/lib/db/types";
import { compareDecimal, isPositive, normalizeDecimalInput } from "@/lib/recovery-engine";
import { APPROVER_ROLES } from "@/types/workspace";
import { RECOVERY_TRANSITIONS, type RecoveryAction } from "./workflow";

export type WorkflowState = { error?: string; message?: string };

export async function transitionRecoveryAction(_previous: WorkflowState, formData: FormData): Promise<WorkflowState> {
  const action = String(formData.get("action") ?? "") as RecoveryAction;
  const recoveryId = String(formData.get("recovery_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const evidenceConfirmed = formData.get("evidence_confirmed") === "on";
  const amount = normalizeDecimalInput(String(formData.get("amount") ?? ""));

  const spec = RECOVERY_TRANSITIONS[action];
  if (!spec || !recoveryId) return { error: "Unknown recovery action." };

  try {
    const workspace = await requireLiveWorkspace(spec.roles);
    const { supabase, organization, user } = workspace;

    const { data: recoveryData } = await supabase.from("recoveries").select("*").eq("id", recoveryId).eq("organization_id", organization.id).single();
    if (!recoveryData) return { error: "Recovery case not found." };
    const recovery = recoveryData as RecoveryRow;
    if (!spec.from.includes(recovery.status)) return { error: `Cannot ${spec.label.toLowerCase()} from status "${recovery.status}".` };

    const { data: findingData } = await supabase.from("findings").select("*").eq("id", recovery.finding_id).single();
    const finding = findingData as FindingRow | null;
    if (!finding) return { error: "Underlying finding is missing." };

    if (spec.requiresNote && note.length < 3) return { error: "A note is required for this step." };
    if (spec.requiresEvidenceConfirmation && !evidenceConfirmed) return { error: "Confirm that you reviewed the evidence package before approving." };
    if (spec.requiresAmount) {
      if (!amount || !isPositive(amount)) return { error: "Enter the amount actually recovered." };
      if (recovery.approved_amount && compareDecimal(amount, recovery.approved_amount) > 0) {
        return { error: `Recovered amount cannot exceed the approved amount (${recovery.approved_amount}).` };
      }
    }
    if (action === "approve" && finding.recoverability !== "recoverable") {
      return { error: "This finding is marked needs-review: verify the evidence and mark it recoverable-quality before approving." };
    }

    const update: Partial<RecoveryRow> = { status: spec.to };
    if (action === "start_review") update.owner_user_id = user.id;
    if (action === "approve") update.approved_amount = recovery.claimed_amount ?? finding.variance_amount;
    if (action === "mark_recovered") update.realized_amount = amount;

    const { error: updateError } = await supabase.from("recoveries").update(update).eq("id", recoveryId);
    if (updateError) return { error: updateError.message };

    if (action === "request_approval") {
      const { error } = await supabase.from("approvals").insert({ organization_id: organization.id, recovery_id: recoveryId, requested_by: user.id, status: "pending" });
      if (error) return { error: `Could not create approval request: ${error.message}` };
      await notifyApprovers(workspace.supabase, organization.id, user.id, finding);
    }

    if (action === "approve" || action === "reject") {
      const { data: pending } = await supabase.from("approvals").select("id").eq("recovery_id", recoveryId).eq("status", "pending").order("requested_at", { ascending: false }).limit(1).maybeSingle();
      if (pending) {
        const { error } = await supabase.from("approvals").update({ status: action === "approve" ? "approved" : "rejected", decided_by: user.id, decided_at: new Date().toISOString(), decision_note: note || null }).eq("id", (pending as { id: string }).id);
        if (error) return { error: `Could not record decision: ${error.message}` };
      }
    }

    if (action === "approve") {
      await supabase.from("savings_ledger").insert({ organization_id: organization.id, recovery_id: recoveryId, kind: "approved", amount: update.approved_amount, currency: recovery.currency, metadata: { findingId: finding.id, approvedBy: user.id } });
    }
    if (action === "mark_recovered") {
      const { error } = await supabase.from("savings_ledger").insert({ organization_id: organization.id, recovery_id: recoveryId, kind: "realized", amount: amount, currency: recovery.currency, metadata: { findingId: finding.id, recordedBy: user.id, note } });
      if (error) return { error: `Could not write savings ledger: ${error.message}` };
      await supabase.from("findings").update({ status: "resolved" }).eq("id", finding.id);
    }
    if (action === "reject" || action === "close") {
      await supabase.from("findings").update({ status: "dismissed" }).eq("id", finding.id);
    }
    if (action === "verify") {
      await supabase.from("findings").update({ status: "verified" }).eq("id", finding.id);
    }

    await supabase.from("recovery_events").insert({
      organization_id: organization.id,
      recovery_id: recoveryId,
      event_type: action,
      actor_user_id: user.id,
      details: { from: recovery.status, to: spec.to, note: note || undefined, amount: amount ?? undefined },
    });
    await writeAuditLog(workspace, `recovery.${action}`, { type: "recovery", id: recoveryId }, { from: recovery.status, to: spec.to, findingId: finding.id, note: note || undefined, amount: amount ?? undefined });

    revalidatePath(`/opportunities/${finding.id}`);
    revalidatePath("/opportunities");
    revalidatePath("/recoveries");
    revalidatePath("/dashboard");
    return { message: `${spec.label} recorded.` };
  } catch (error) {
    if (error instanceof WorkspaceAccessError) return { error: error.message };
    return { error: error instanceof Error ? error.message : "Action failed." };
  }
}

type AnySupabase = Awaited<ReturnType<typeof requireLiveWorkspace>>["supabase"];

async function notifyApprovers(supabase: AnySupabase, organizationId: string, requesterId: string, finding: FindingRow) {
  const { data: approvers } = await supabase.from("organization_members").select("user_id, role").eq("organization_id", organizationId).in("role", APPROVER_ROLES);
  const rows = ((approvers ?? []) as Array<{ user_id: string }>)
    .filter((member) => member.user_id !== requesterId)
    .map((member) => ({
      organization_id: organizationId,
      user_id: member.user_id,
      kind: "approval_requested",
      title: `Approval requested · ${finding.title}`,
      body: `${finding.variance_amount} ${finding.currency} claim is waiting for your decision.`,
      entity_type: "finding",
      entity_id: finding.id,
    }));
  if (rows.length > 0) await supabase.from("notifications").insert(rows);
}
