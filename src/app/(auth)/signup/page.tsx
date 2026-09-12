import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Create account · Recovra" };

export default function SignUpPage() {
  return (
    <>
      <header className="auth-card-head"><span className="eyebrow">Get started</span><h2>Create your Recovra account</h2></header>
      {isSupabaseConfigured()
        ? <SignUpForm/>
        : <p className="form-status error">Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</p>}
    </>
  );
}
