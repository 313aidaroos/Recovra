"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail, UserPlus } from "lucide-react";
import { signUpAction, signUpMagicLinkAction, type AuthFormState } from "@/lib/auth/actions";
import { FormStatus } from "./form-status";

const initial: AuthFormState = {};

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);
  const [magicState, magicAction, magicPending] = useActionState(signUpMagicLinkAction, initial);

  return (
    <>
      <form action={action} className="auth-form">
        <label>Full name<input name="full_name" autoComplete="name" required placeholder="Alex Morgan"/></label>
        <label>Work email<input name="email" type="email" autoComplete="email" required placeholder="you@company.com"/></label>
        <label>Password<input name="password" type="password" autoComplete="new-password" minLength={10} required placeholder="At least 10 characters"/></label>
        <FormStatus state={state}/>
        <button className="primary-button wide" type="submit" disabled={pending}><UserPlus size={15}/> {pending ? "Creating account…" : "Create account"}</button>
        <p className="muted-note">By creating an account you agree to the <Link className="text-link" href="/terms">Terms of Service</Link> and <Link className="text-link" href="/privacy">Privacy Policy</Link>.</p>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <form action={magicAction} className="auth-form compact">
        <label>Full name<input name="full_name" autoComplete="name" required placeholder="Alex Morgan"/></label>
        <label>Work email<input name="email" type="email" autoComplete="email" required placeholder="you@company.com"/></label>
        <FormStatus state={magicState}/>
        <button className="secondary-button tall wide" type="submit" disabled={magicPending}><Mail size={15}/> {magicPending ? "Sending…" : "Send magic signup link"}</button>
      </form>
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </>
  );
}
