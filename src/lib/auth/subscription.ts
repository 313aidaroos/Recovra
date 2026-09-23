/**
 * BILLING HARDENING #2: Enforce subscription expiry on server.
 * Gates upload/audit behind active plan (not just "row exists").
 */

import { getWorkspace } from "./workspace";
import { redirect } from "next/navigation";

export async function requireActiveSubscription() {
  const workspace = await getWorkspace();
  
  // Demo mode = always allowed (no subscription needed)
  if (workspace.mode !== "live") {
    return workspace;
  }

  // Live mode: check has_active_plan via SECURITY DEFINER function
  const { data, error } = await workspace.supabase.rpc("has_active_plan", {
    p_org: workspace.organization.id,
  });

  if (error) {
    console.error("Failed to check subscription:", error);
    redirect("/pricing?error=subscription_check_failed");
  }

  if (!data) {
    // No active plan or lapsed
    redirect("/pricing?error=subscription_required");
  }

  return workspace;
}
