"use client";

import { useActionState } from "react";
import { Building2 } from "lucide-react";
import { createOrganizationAction, type AuthFormState } from "@/lib/auth/actions";
import { FormStatus } from "./form-status";

const initial: AuthFormState = {};

export function CreateOrganizationForm() {
  const [state, action, pending] = useActionState(createOrganizationAction, initial);

  return (
    <form action={action} className="auth-form">
      <label>Organization name<input name="name" required minLength={2} placeholder="Acme Logistics Inc."/></label>
      <FormStatus state={state}/>
      <button className="primary-button wide" type="submit" disabled={pending}><Building2 size={15}/> {pending ? "Creating workspace…" : "Create workspace"}</button>
    </form>
  );
}
