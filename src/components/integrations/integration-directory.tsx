import { Bot, Boxes, Cloud, CreditCard, Database, PlugZap, RadioTower } from "lucide-react";
import { PageHeader } from "../ui/page-header";
import { StatusBadge } from "../ui/status-badge";

const groups = [
  ["Accounting / ERP", Database, [["QuickBooks","Available"],["NetSuite","Requires Setup"],["SAP","Coming Soon"],["Oracle","Coming Soon"],["Microsoft Dynamics","Coming Soon"],["Xero","Available"]]],
  ["Payments", CreditCard, [["Stripe","Available"],["PayPal","Coming Soon"],["Square","Coming Soon"],["Adyen","Coming Soon"]]],
  ["Cloud", Cloud, [["AWS","Requires Setup"],["Azure","Coming Soon"],["Google Cloud","Coming Soon"],["Vercel","Available"],["Cloudflare","Coming Soon"]]],
  ["AI", Bot, [["OpenAI","Requires Setup"],["Anthropic","Requires Setup"],["Google Gemini","Coming Soon"],["Azure AI","Coming Soon"],["AWS Bedrock","Coming Soon"]]],
  ["Collaboration / SaaS", RadioTower, [["Microsoft 365","Available"],["Google Workspace","Available"],["Slack","Coming Soon"],["Salesforce","Coming Soon"],["HubSpot","Coming Soon"],["GitHub","Available"]]],
  ["Logistics", Boxes, [["NorthStar Parcel API","Connected"],["Parcel CSV","Available"],["Freight EDI","Requires Setup"],["TMS / WMS","Coming Soon"]]],
] as const;

export function IntegrationDirectory() {
  return (
    <>
      <PageHeader eyebrow="Connector ecosystem" title="Integrations" description="Bring contracts, invoices, usage, and operational truth into one recovery intelligence layer." actions={<button className="primary-button"><PlugZap size={15}/> Request integration</button>}/>
      <div className="integration-notice"><PlugZap size={17}/><div><strong>Connector readiness is explicit.</strong><span>Only NorthStar Parcel API is connected in this sample workspace. “Available” connectors still require organization credentials and setup.</span></div></div>
      <section className="integration-groups">
        {groups.map(([group, Icon, integrations]) => (
          <article className="panel" key={group}>
            <div className="integration-group-head"><span><Icon size={19}/></span><div><h3>{group}</h3><p>{integrations.length} connectors</p></div></div>
            <div className="integration-grid">
              {integrations.map(([name,status]) => <div key={name}><span className="integration-mark">{name.slice(0,2).toUpperCase()}</span><div><strong>{name}</strong><small>Secure organization-level connection</small></div><StatusBadge tone={status === "Connected" ? "good" : status === "Available" ? "info" : "neutral"}>{status}</StatusBadge><button>{status === "Connected" ? "Manage" : status === "Available" || status === "Requires Setup" ? "Configure" : "Notify me"}</button></div>)}
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
