import type { RecoveryStatus } from "@/lib/db/types";
import { APPROVER_ROLES, WRITER_ROLES, type OrganizationRole } from "@/types/workspace";

export type RecoveryAction =
  | "start_review"
  | "verify"
  | "request_approval"
  | "approve"
  | "reject"
  | "mark_submitted"
  | "vendor_reviewing"
  | "mark_recovered"
  | "close";

export type TransitionSpec = {
  from: RecoveryStatus[];
  to: RecoveryStatus;
  roles: OrganizationRole[];
  label: string;
  description: string;
  requiresNote?: boolean;
  requiresAmount?: boolean;
  requiresEvidenceConfirmation?: boolean;
};

/**
 * The only way a recovery changes state. Recovra never contacts a vendor:
 * "mark_submitted" records that a human sent the claim through their own channel.
 */
export const RECOVERY_TRANSITIONS: Record<RecoveryAction, TransitionSpec> = {
  start_review: { from: ["detected"], to: "reviewing", roles: WRITER_ROLES, label: "Start review", description: "Assign yourself and begin validating the evidence." },
  verify: { from: ["detected", "reviewing"], to: "verified", roles: WRITER_ROLES, label: "Mark verified", description: "The calculation and evidence have been checked by a person." },
  request_approval: { from: ["verified"], to: "approval_requested", roles: WRITER_ROLES, label: "Request approval", description: "Send the claim package to an approver (owner, admin or finance)." },
  approve: { from: ["approval_requested"], to: "approved", roles: APPROVER_ROLES, label: "Approve claim", description: "Authorise the claim amount for submission to the vendor.", requiresEvidenceConfirmation: true },
  reject: { from: ["approval_requested", "verified", "reviewing", "detected"], to: "rejected", roles: APPROVER_ROLES, label: "Reject", description: "Decline the claim with a reason.", requiresNote: true },
  mark_submitted: { from: ["approved"], to: "submitted", roles: WRITER_ROLES, label: "Record submission", description: "Record that the approved claim was sent to the vendor (reference required).", requiresNote: true },
  vendor_reviewing: { from: ["submitted"], to: "vendor_reviewing", roles: WRITER_ROLES, label: "Vendor reviewing", description: "The vendor acknowledged the claim and is reviewing it." },
  mark_recovered: { from: ["submitted", "vendor_reviewing", "approved"], to: "recovered", roles: APPROVER_ROLES, label: "Record recovery", description: "Enter the credit or refund actually received.", requiresAmount: true },
  close: { from: ["detected", "reviewing", "verified", "rejected", "submitted", "vendor_reviewing"], to: "closed", roles: APPROVER_ROLES, label: "Close without recovery", description: "Close the case with a reason.", requiresNote: true },
};

export function availableActions(status: RecoveryStatus, role: OrganizationRole): RecoveryAction[] {
  return (Object.keys(RECOVERY_TRANSITIONS) as RecoveryAction[]).filter((action) => {
    const spec = RECOVERY_TRANSITIONS[action];
    return spec.from.includes(status) && spec.roles.includes(role);
  });
}

export const RECOVERY_STATUS_LABELS: Record<RecoveryStatus, string> = {
  detected: "Detected",
  reviewing: "Reviewing",
  verified: "Verified",
  approval_requested: "Claim Ready",
  approved: "Approved",
  rejected: "Rejected",
  submitted: "Submitted",
  vendor_reviewing: "Vendor Reviewing",
  recovered: "Recovered",
  closed: "Closed",
};
