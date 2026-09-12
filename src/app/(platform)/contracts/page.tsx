import { ResourcePage } from "@/components/resources/resource-page";
import { contracts } from "@/lib/platform-data";

export default function ContractsPage() {
  return <ResourcePage eyebrow="Agreement intelligence" title="Contracts" description="Inspect active terms, rate tables, amendments, service levels, credits, and renewal exposure." actionLabel="Add contract" columns={["Agreement","Vendor","Effective","Expires","Status","Renewal notice","Clauses"]} rows={contracts} statusColumns={[4]}>
    <section className="contract-watch">
      <article><span>Renewal attention</span><strong>DataDesk · 18 days</strong><small>True-down notice closes Sep 15</small></article>
      <article><span>Credit clause</span><strong>NorthStar Parcel · 4.2</strong><small>Residential surcharge ceiling active</small></article>
      <article><span>Service-level exposure</span><strong>Rapid 3PL · 2 SLAs</strong><small>Monthly performance evidence available</small></article>
    </section>
  </ResourcePage>;
}
