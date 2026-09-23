"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { setPasswordAction, type AuthFormState } from "@/lib/auth/actions";
import { FormStatus } from "@/components/auth/form-status";

function SetPasswordPageInner() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const [state, action, pending] = useActionState(setPasswordAction, {} as AuthFormState);

  return (
    <>
      <header className="auth-card-head">
        <span className="eyebrow">YOU ARE SIGNED IN</span>
        <h2>Choose a password</h2>
      </header>
      <p style={{ color: "#8e99a5", fontSize: 14, marginBottom: 24 }}>
        Next time you can sign in without waiting for an email. This password works on every Apixis family site.
      </p>
      <form action={action} className="auth-form">
        <input type="hidden" name="next" value={next} />
        <label>
          New password (min 10 characters)
          <input 
            name="password" 
            type="password" 
            required 
            minLength={10} 
            autoComplete="new-password" 
            placeholder="at least 10 characters"
            disabled={pending}
          />
        </label>
        <FormStatus state={state} />
        <button className="primary-button wide" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save password and continue"}
        </button>
      </form>
      <p className="auth-switch">
        <Link href={next}>Skip for now →</Link>
      </p>
    </>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <SetPasswordPageInner />
    </Suspense>
  );
}
