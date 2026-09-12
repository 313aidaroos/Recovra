import { ResourcePage } from "@/components/resources/resource-page";
import { contracts } from "@/lib/platform-data";

export default function ContractsPage() {
  return <ResourcePage eyebrow="Agreement intelligence" title="Contracts" description="Inspect active terms, rate tables, amendments, service levels, credits, and renewal exposure." actionLabel="Add contract" columns={["Agreement","Vendor","Effective","Expires","Status","Renewal notice","Clauses"]} rows={contracts} statusColumns={[4]}/>;
}
