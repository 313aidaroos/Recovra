"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE, getWorkspace, requireLiveWorkspace } from "./workspace";
import { ADMIN_ROLES, ORGANIZATION_ROLES, type OrganizationRole } from "@/types/workspace";

export type AuthFormState = { error?: string; message?: string };

async function siteOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function safeNextPath(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

export async function signInAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured for this deployment." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };
  redirect(safeNextPath(formData.get("next")));
}

export async function signUpAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured for this deployment." };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!email || password.length < 10) return { error: "Use a valid email and a password of at least 10 characters." };

  const origin = await siteOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName }, emailRedirectTo: `${origin}/auth/callback?next=/onboarding` },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/onboarding");
  return { message: "Check your inbox to confirm your email, then sign in to create your organization." };
}

export async function sendMagicLinkAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured for this deployment." };
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };
  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=/dashboard` },
  });
  if (error) return { error: error.message };
  return { message: "Magic link sent. Open the email on this device to sign in." };
}

export async function signOutAction() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_ORG_COOKIE);
  redirect("/");
}

export async function createOrganizationAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const workspace = await getWorkspace();
  if (workspace.mode === "demo") return { error: "Sign in first." };

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Organization name must be at least 2 characters." };

  const { data, error } = await workspace.supabase.rpc("create_organization", { p_name: name, p_slug: "" });
  if (error) return { error: error.message };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, String(data), { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  redirect("/dashboard");
}

export async function switchOrganizationAction(formData: FormData) {
  const workspace = await requireLiveWorkspace();
  const target = String(formData.get("organization_id") ?? "");
  if (!workspace.memberships.some((membership) => membership.organization.id === target)) return;
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, target, { path: "/", httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  redirect("/dashboard");
}

export async function addMemberAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const workspace = await requireLiveWorkspace(ADMIN_ROLES);
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "viewer") as OrganizationRole;
  if (!email) return { error: "Enter the teammate's email." };
  if (!ORGANIZATION_ROLES.includes(role)) return { error: "Invalid role." };

  const { data, error } = await workspace.supabase.rpc("add_organization_member", {
    p_org: workspace.organization.id,
    p_email: email,
    p_role: role,
  });
  if (error) return { error: error.message };
  const result = data as { status: string };
  if (result.status === "user_not_found") {
    return { error: `${email} has not created a Recovra account yet. Ask them to sign up, then add them again.` };
  }
  return { message: `${email} now has the ${role} role.` };
}

export async function updateOrganizationAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const workspace = await requireLiveWorkspace(ADMIN_ROLES);
  const name = String(formData.get("name") ?? "").trim();
  const currency = String(formData.get("currency") ?? "USD").toUpperCase().slice(0, 3);
  const threshold = String(formData.get("review_threshold") ?? "1000");
  if (name.length < 2) return { error: "Organization name must be at least 2 characters." };
  if (!/^\d+(\.\d{1,2})?$/.test(threshold)) return { error: "Review threshold must be a positive amount." };

  const { error } = await workspace.supabase
    .from("organizations")
    .update({ name, currency, review_threshold: threshold })
    .eq("id", workspace.organization.id);
  if (error) return { error: error.message };
  return { message: "Organization settings saved." };
}
