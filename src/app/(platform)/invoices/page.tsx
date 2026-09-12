import { ResourcePage } from "@/components/resources/resource-page";
import { invoices } from "@/lib/platform-data";

export default function InvoicesPage() {
  return <ResourcePage eyebrow="Billing intelligence" title="Invoices" description="Track every invoice through normalization, contract matching, and line-level audit." actionLabel="Add invoice" columns={["Invoice","Vendor","Amount","Date","Audit state","Discrepancy","Linked contract","Findings"]} rows={invoices} statusColumns={[4]} moneyColumns={[2,5]}/>;
}
