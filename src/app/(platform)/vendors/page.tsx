import { VendorsTable } from "@/components/live/vendors-table";
import { ResourcePage } from "@/components/resources/resource-page";
import { getWorkspace } from "@/lib/auth/workspace";
import { loadVendors } from "@/lib/db/resources";
import { vendors } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const workspace = await getWorkspace();
  if (workspace.mode === "live") {
    const rows = await loadVendors(workspace);
    return <VendorsTable rows={rows} currency={workspace.organization.currency}/>;
  }
  return <ResourcePage eyebrow="Vendor intelligence" title="Vendors" description="Monitor spend, recurring discrepancies, contract exposure, renewals, and anomaly risk by vendor." actionLabel="Add vendor" columns={["Vendor","Industry","Total spend","Recovered","Potential","Contracts","Invoices","Risk score"]} rows={vendors} moneyColumns={[2,3,4]}/>;
}
