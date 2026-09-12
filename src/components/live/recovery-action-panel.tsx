"use client";

import { useActionState, useState } from "react";
import { Check, CheckCircle2, LockKeyhole, Send } from "lucide-react";
import { transitionRecoveryAction, type WorkflowState } from "@/lib/recovery/actions";
import { RECOVERY_TRANSITIONS, type RecoveryAction } from "@/lib/recovery/workflow";
import { FormStatus } from "../auth/form-status";

const initial: WorkflowState = {};

export function RecoveryActionPanel({
  recoveryId,
  actions,
  currency,
  claimedAmount,
  approvedAmount,
  recoverability,
}: {
  recoveryId: string;
  actions: RecoveryAction[];
  currency: string;
  claimedAmount: string | null;
  approvedAmount: string | null;
  recoverability: string;
}) {
  const [state, formAction, pending] = useActionState(transitionRecoveryAction, initial);
  const [selected, setSelected] = useState<RecoveryAction | null>(actions[0] ?? null);
  const [confirmed, setConfirmed] = useState(false);
  const spec = selected ? RECOVERY_TRANSITIONS[selected] : null;

  if (actions.length === 0) {
    return (
      <article className="panel action-card">
        <span className="panel-kicker">Next action</span>
        <h3>No action available for your role</h3>
        <p>This case is waiting on another role (for example an approver) or has reached a terminal state.</p>
        <FormStatus state={state}/>
        <div className="human-control"><LockKeyhole size={14}/> Recovra will never submit without human approval.</div>
      </article>
    );
  }

  return (
    <article className="panel action-card">
      <span className="panel-kicker">Recommended next action</span>
      <h3>{spec?.label ?? "Choose an action"}</h3>
      <p>{spec?.description}</p>
      {actions.length > 1 && (
        <div className="action-tabs" role="tablist">
          {actions.map((action) => (
            <button key={action} type="button" role="tab" aria-selected={selected === action} className={selected === action ? "active" : ""} onClick={() => { setSelected(action); setConfirmed(false); }}>
              {RECOVERY_TRANSITIONS[action].label}
            </button>
          ))}
        </div>
      )}
      {spec && selected && (
        <form action={formAction} className="workflow-form">
          <input type="hidden" name="recovery_id" value={recoveryId}/>
          <input type="hidden" name="action" value={selected}/>
          {selected === "approve" && recoverability !== "recoverable" && (
            <p className="form-status error">This finding is still marked needs-review. Approvals are only allowed for verified-quality findings.</p>
          )}
          {spec.requiresEvidenceConfirmation && (
            <label className="approval-check">
              <input type="checkbox" name="evidence_confirmed" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/>
              <span>{confirmed && <Check size={13}/>}</span>
              <div><strong>I reviewed the evidence package</strong><small>Approving authorises {claimedAmount ?? "the claimed amount"} {currency} for submission to the vendor.</small></div>
            </label>
          )}
          {spec.requiresAmount && (
            <label className="field-label">Amount recovered ({currency})<input name="amount" inputMode="decimal" placeholder={approvedAmount ?? claimedAmount ?? "0.00"} required/></label>
          )}
          {(spec.requiresNote || selected === "approve" || selected === "verify") && (
            <label className="field-label">{selected === "mark_submitted" ? "Submission reference (email, portal case, dispute ID)" : spec.requiresNote ? "Reason" : "Note (optional)"}<textarea name="note" rows={3} required={spec.requiresNote}/></label>
          )}
          <FormStatus state={state}/>
          <button className="primary-button wide" type="submit" disabled={pending || (spec.requiresEvidenceConfirmation && !confirmed) || (selected === "approve" && recoverability !== "recoverable")}>
            {pending ? <><CheckCircle2 size={15}/> Saving…</> : <><Send size={15}/> {spec.label}</>}
          </button>
        </form>
      )}
      <div className="human-control"><LockKeyhole size={14}/> Recovra records decisions; it never sends claims or money on your behalf.</div>
    </article>
  );
}
