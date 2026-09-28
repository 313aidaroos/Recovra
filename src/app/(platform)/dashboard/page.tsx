import { getWorkspace } from "@/lib/auth/workspace";
import { loadDashboard } from "@/lib/db/dashboard";
import { LiveDashboard } from "@/components/live/live-dashboard";
import { RecoveryDashboard } from "@/components/recovery-dashboard";
import { ApixisWorldWelcome } from "@/components/apixis-world-welcome";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const workspace = await getWorkspace();
  if (workspace.mode !== "live") return <RecoveryDashboard/>;
  const data = await loadDashboard(workspace);
  return (
    <>
      {/* Apixis world: new accounts get their own agent created server-side; one-time welcome card. */}
      <ApixisWorldWelcome/>
      <LiveDashboard data={data} organizationName={workspace.organization.name} currency={workspace.organization.currency}/>
    </>
  );
}
