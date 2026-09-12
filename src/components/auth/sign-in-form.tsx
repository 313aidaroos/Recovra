"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn, Mail } from "lucide-react";
import { sendMagicLinkAction, signInAction, type AuthFormState } from "@/lib/auth/actions";
import { FormStatus } from "./form-status";

const initial: AuthFormState = {};

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState(signInAction, initialError ? { error: initialError } : initial);
  const [linkState, linkAction, linkPending] = useActionState(sendMagicLinkAction, initial);

  return (
    <>
      <form action={action} className="auth-form">
        <input type="hidden" name="next" value={next}/>
        <label>Work email<input name="email" type="email" autoComplete="email" required placeholder="you@company.com"/></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required/></label>
        <FormStatus state={state}/>
        <button className="primary-button wide" type="submit" disabled={pending}><LogIn size={15}/> {pending ? "Signing in…" : "Sign in"}</button>
      </form>
      <div className="auth-divider"><span>or</span></div>
      <form action={linkAction} className="auth-form compact">
        <label>Email me a magic link<input name="email" type="email" autoComplete="email" required placeholder="you@company.com"/></label>
        <FormStatus state={linkState}/>
        <button className="secondary-button tall wide" type="submit" disabled={linkPending}><Mail size={15}/> {linkPending ? "Sending…" : "Send magic link"}</button>
      </form>
      <p className="auth-switch">New to Recovra? <Link href="/signup">Create an account</Link></p>
    </>
  );
}
