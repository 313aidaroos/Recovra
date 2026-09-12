import { ResourcePage } from "@/components/resources/resource-page";
import { vendors } from "@/lib/platform-data";

export default function VendorsPage() {
  return <ResourcePage eyebrow="Vendor intelligence" title="Vendors" description="Monitor spend, recurring discrepancies, contract exposure, renewals, and anomaly risk by vendor." actionLabel="Add vendor" columns={["Vendor","Industry","Total spend","Recovered","Potential","Contracts","Invoices","Risk score"]} rows={vendors} moneyColumns={[2,3,4]}/>;
}
