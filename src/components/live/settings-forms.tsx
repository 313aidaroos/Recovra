"use client";

import { useActionState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import { addMemberAction, changePasswordAction, updateOrganizationAction, type AuthFormState } from "@/lib/auth/actions";
import { ORGANIZATION_ROLES } from "@/types/workspace";
import type { Organization } from "@/types/workspace";
import { FormStatus } from "../auth/form-status";

const initial: AuthFormState = {};

export function OrganizationForm({ organization, disabled }: { organization: Organization; disabled: boolean }) {
  const [state, action, pending] = useActionState(updateOrganizationAction, initial);
  return (
    <form action={action}>
      <label>Organization name<input name="name" defaultValue={organization.name} required minLength={2} disabled={disabled}/></label>
      <label>Primary currency
        <select name="currency" defaultValue={organization.currency} disabled={disabled}>
          <option value="USD">USD — United States Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — Pound Sterling</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="MXN">MXN — Mexican Peso</option>
        </select>
      </label>
      <label>Financial review threshold
        <input name="review_threshold" defaultValue={organization.review_threshold ?? "1000"} inputMode="decimal" pattern="^\d+(\.\d{1,2})?$" disabled={disabled}/>
      </label>
      <FormStatus state={state}/>
      {!disabled && <button className="primary-button" type="submit" disabled={pending}>{pending ? "Saving…" : "Save changes"}</button>}
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, initial);
  return (
    <form action={action} className="workflow-form">
      <label className="field-label">New password<input name="password" type="password" autoComplete="new-password" minLength={10} required placeholder="At least 10 characters"/></label>
      <label className="field-label">Confirm new password<input name="confirm_password" type="password" autoComplete="new-password" minLength={10} required/></label>
      <FormStatus state={state}/>
      <button className="primary-button" type="submit" disabled={pending}><KeyRound size={15}/> {pending ? "Updating…" : "Update password"}</button>
    </form>
  );
}

export function AddMemberForm() {
  const [state, action, pending] = useActionState(addMemberAction, initial);
  return (
    <form action={action} className="workflow-form">
      <label className="field-label">Teammate email<input name="email" type="email" required placeholder="controller@company.com"/></label>
      <label className="field-label">Role
        <select name="role" defaultValue="analyst">
          {ORGANIZATION_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </label>
      <FormStatus state={state}/>
      <button className="primary-button" type="submit" disabled={pending}><UserPlus size={15}/> {pending ? "Adding…" : "Add member"}</button>
    </form>
  );
}
