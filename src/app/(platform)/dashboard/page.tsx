import { getWorkspace } from "@/lib/auth/workspace";
import { loadDashboard } from "@/lib/db/dashboard";
import { LiveDashboard } from "@/components/live/live-dashboard";
import { RecoveryDashboard } from "@/components/recovery-dashboard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const workspace = await getWorkspace();
  if (workspace.mode !== "live") return <RecoveryDashboard/>;
  const data = await loadDashboard(workspace);
  return <LiveDashboard data={data} organizationName={workspace.organization.name} currency={workspace.organization.currency}/>;
}
