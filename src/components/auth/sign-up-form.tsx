"use client";

import Link from "next/link";

// 2026-10-04 (Grok, Apixis ID only): new Recovra accounts are created with Apixis ID only.
// The email + password and "magic signup link" forms were removed; existing accounts sign in on /login.
export function SignUpForm() {
  return (
    <>
      <div className="auth-form">
        <a className="primary-button wide" href={`/auth/apixis/start?next=${encodeURIComponent("/onboarding")}`}>Sign in with Apixis</a>
        <p className="muted-note">New Recovra accounts are created with Apixis ID: one account for every Apixis site. By creating an account you agree to the <Link className="text-link" href="/terms">Terms of Service</Link> and <Link className="text-link" href="/privacy">Privacy Policy</Link>.</p>
      </div>
      <p className="auth-switch">Already have an account? <Link href="/login">Sign in</Link></p>
    </>
  );
}
