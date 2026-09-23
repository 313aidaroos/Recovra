"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { LogIn, Mail } from "lucide-react";
import { sendMagicLinkAction, signInAction, type AuthFormState } from "@/lib/auth/actions";
import { FormStatus } from "./form-status";

const initial: AuthFormState = {};

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [tab, setTab] = useState<"magic" | "password">("magic");
  const [linkState, linkAction, linkPending] = useActionState(sendMagicLinkAction, initialError ? { error: initialError } : initial);
  const [passState, passAction, passPending] = useActionState(signInAction, initial);

  return (
    <>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid #272e36" }}>
        <button
          type="button"
          onClick={() => setTab("magic")}
          style={{
            flex: 1,
            padding: "12px 16px",
            background: "none",
            border: "none",
            borderBottom: tab === "magic" ? "2px solid #c8ff63" : "2px solid transparent",
            color: tab === "magic" ? "#c8ff63" : "#8e99a5",
            fontWeight: tab === "magic" ? 700 : 400,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          <Mail size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Magic link
        </button>
        <button
          type="button"
          onClick={() => setTab("password")}
          style={{
            flex: 1,
            padding: "12px 16px",
            background: "none",
            border: "none",
            borderBottom: tab === "password" ? "2px solid #c8ff63" : "2px solid transparent",
            color: tab === "password" ? "#c8ff63" : "#8e99a5",
            fontWeight: tab === "password" ? 700 : 400,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          <LogIn size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />
          Password
        </button>
      </div>

      {/* Magic link form (DEFAULT) */}
      {tab === "magic" && (
        <form action={linkAction} className="auth-form">
          <input type="hidden" name="next" value={next} />
          <label>
            Work email
            <input 
              name="email" 
              type="email" 
              autoComplete="email" 
              required 
              placeholder="you@company.com"
              disabled={linkPending}
            />
          </label>
          <FormStatus state={linkState} />
          <button className="primary-button wide" type="submit" disabled={linkPending}>
            <Mail size={15} /> {linkPending ? "Sending…" : "Email me a sign-in link"}
          </button>
          <p style={{ fontSize: 13, color: "#8e99a5", marginTop: 12 }}>
            We&apos;ll email you a link. First time? You&apos;ll choose a password after signing in.
          </p>
        </form>
      )}

      {/* Password form (secondary tab) */}
      {tab === "password" && (
        <form action={passAction} className="auth-form">
          <input type="hidden" name="next" value={next} />
          <label>
            Work email
            <input 
              name="email" 
              type="email" 
              autoComplete="email" 
              required 
              placeholder="you@company.com"
              disabled={passPending}
            />
          </label>
          <label>
            Password
            <input 
              name="password" 
              type="password" 
              autoComplete="current-password" 
              required
              disabled={passPending}
            />
          </label>
          <FormStatus state={passState} />
          <button className="primary-button wide" type="submit" disabled={passPending}>
            <LogIn size={15} /> {passPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      <p className="auth-switch">New to Recovra? <Link href="/signup">Create an account</Link></p>
    </>
  );
}
