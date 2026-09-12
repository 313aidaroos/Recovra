import { LiveRecoveries } from "@/components/live/live-recoveries";
import { RecoveriesTable } from "@/components/recoveries-table";
import { getWorkspace } from "@/lib/auth/workspace";
import { loadDashboard } from "@/lib/db/dashboard";
import { loadFindings } from "@/lib/db/findings";

export const dynamic = "force-dynamic";

export default async function Recoveries() {
  const workspace = await getWorkspace();
  if (workspace.mode !== "live") return <RecoveriesTable/>;
  const [rows, dashboard] = await Promise.all([loadFindings(workspace), loadDashboard(workspace)]);
  return <LiveRecoveries rows={rows} pipeline={dashboard.pipeline} currency={workspace.organization.currency}/>;
}
