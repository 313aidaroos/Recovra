"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ACTIVE_ORG_COOKIE, getWorkspace, requireLiveWorkspace, writeAuditLog } from "./workspace";
import { magicLinkRedirect, safeNextPath } from "./redirects";
import { ADMIN_ROLES, ORGANIZATION_ROLES, type OrganizationRole } from "@/types/workspace";

export type AuthFormState = { error?: string; message?: string };

async function siteOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "localhost:3000";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
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
    options: { data: { full_name: fullName }, emailRedirectTo: magicLinkRedirect(origin, "/onboarding") },
  });
  if (error) return { error: error.message };
  if (data.session) redirect("/onboarding");
  // The confirmation link verifies the account server-side even if the page it lands on is not
  // this deployment, so a password sign-in afterwards always works.
  return { message: `Account created. We emailed a confirmation link to ${email}. Click it, then come back to this site and sign in with your password to create your organization.` };
}

export async function signUpMagicLinkAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured for this deployment." };

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, data: { full_name: fullName }, emailRedirectTo: magicLinkRedirect(origin, "/onboarding") },
  });
  if (error) return { error: error.message };
  return { message: `Magic signup link sent to ${email}. Open it to enter Recovra and create your organization.` };
}

export async function sendMagicLinkAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured for this deployment." };
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };
  const origin = await siteOrigin();
  const rawNext = String(formData.get("next") ?? "/dashboard");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { 
      shouldCreateUser: true,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`/set-password?next=${encodeURIComponent(next)}`)}`,
    },
  });
  if (error) return { error: error.message };
  return { message: `Check ${email} — the sign-in link is on its way. First time? You will choose a password after it opens.` };
}

export async function changePasswordAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured for this deployment." };
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== confirm) return { error: "The two passwords do not match." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { message: "Password updated. Use it the next time you sign in." };
}

/** Called from /set-password after a magic-link sign-in. FAMILY STANDARD. */
export async function setPasswordAction(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured." };
  const password = String(formData.get("password") ?? "");
  const rawNext = String(formData.get("next") ?? "/dashboard");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";
  if (password.length < 10) return { error: "Password must be at least 10 characters." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Your sign-in link expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password, data: { password_set: true } });
  if (error) return { error: error.message };
  redirect(next);
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
  await writeAuditLog(workspace, "organization.updated", { type: "organization", id: workspace.organization.id }, { name, currency, review_threshold: threshold });
  // The workspace context is memoised per request, so re-render from a fresh request.
  revalidatePath("/", "layout");
  redirect("/settings?saved=organization");
}
