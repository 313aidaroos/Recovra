import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreateOrganizationForm } from "@/components/auth/create-organization-form";
import { signOutAction } from "@/lib/auth/actions";
import { getWorkspace } from "@/lib/auth/workspace";

export const metadata: Metadata = { title: "Create organization · Recovra" };

export default async function OnboardingPage() {
  const workspace = await getWorkspace();
  if (workspace.mode === "demo") redirect("/login?next=/onboarding");
  if (workspace.mode === "live") redirect("/dashboard");

  return (
    <>
      <header className="auth-card-head">
        <span className="eyebrow">Step 1 of 1</span>
        <h2>Create your organization</h2>
        <p>Signed in as {workspace.user.email}. You will be the owner and can add finance, analyst and reviewer teammates from Settings.</p>
      </header>
      <CreateOrganizationForm/>
      <form action={signOutAction} className="auth-switch"><button type="submit" className="text-link">Use a different account</button></form>
    </>
  );
}
