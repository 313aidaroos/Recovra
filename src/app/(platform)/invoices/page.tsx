import { InvoicesTable } from "@/components/live/invoices-table";
import { ResourcePage } from "@/components/resources/resource-page";
import { getWorkspace } from "@/lib/auth/workspace";
import { loadInvoices } from "@/lib/db/resources";
import { invoices } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ vendor?: string }> }) {
  const workspace = await getWorkspace();
  if (workspace.mode !== "live") {
    return <ResourcePage eyebrow="Billing intelligence" title="Invoices" description="Track every invoice through normalization, contract matching, and line-level audit." actionLabel="Add invoice" columns={["Invoice","Vendor","Amount","Date","Audit state","Discrepancy","Linked contract","Findings"]} rows={invoices} statusColumns={[4]} moneyColumns={[2,5]} hrefPrefix="/invoices"/>;
  }
  const { vendor } = await searchParams;
  const rows = await loadInvoices(workspace, vendor || undefined);
  return <InvoicesTable rows={rows}/>;
}
