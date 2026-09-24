import type { Metadata } from "next";
import { SignInForm } from "@/components/auth/sign-in-form";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SignInWithApixis } from "@/components/SignInWithApixis";

export const metadata: Metadata = { title: "Sign in · Recovra" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/dashboard";
  const initialError = params.error === "link_invalid" ? "That sign-in link is invalid or expired. Request a new one." : undefined;

  return (
    <>
      <header className="auth-card-head"><span className="eyebrow">Welcome back</span><h2>Sign in to your workspace</h2></header>
      {isSupabaseConfigured()
        ? <><SignInWithApixis next={next}/><SignInForm next={next} initialError={initialError}/></>
        : <p className="form-status error">Authentication is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.</p>}
    </>
  );
}
