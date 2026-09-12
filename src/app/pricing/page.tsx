import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Brand } from "@/components/brand";

const plans = [
  ["Starter","For smaller businesses building a repeatable recovery process.",["Core recovery dashboard","Invoice and contract uploads","Logistics + AP starter modules","Evidence packages"]],
  ["Growth","For growing organizations with fragmented multi-vendor spend.",["Everything in Starter","Multiple industry modules","Recovery workflows and approvals","Advanced reporting"]],
  ["Enterprise","For complex organizations requiring controls, scale, and custom connectivity.",["Everything in Growth","SSO / SCIM roadmap","Custom rules and integrations","Advanced RBAC and support"]],
] as const;

export default function PricingPage() {
  return (
    <main className="pricing-page">
      <nav className="marketing-nav"><Link href="/"><Brand/></Link><Link href="/">Back to platform</Link><Link className="nav-cta" href="/dashboard">Get Started <ArrowRight size={15}/></Link></nav>
      <section className="pricing-hero"><span className="eyebrow">Value-aligned pricing</span><h1>Start with proof. Scale with recovery.</h1><p>Choose a platform tier or structure a configurable performance option around verified, realized recoveries.</p></section>
      <section className="pricing-grid">{plans.map(([name,description,features],index)=><article className={index===1?"featured":""} key={name}>{index===1&&<span className="popular">Most flexible</span>}<h2>{name}</h2><p>{description}</p><strong>{name==="Enterprise"?"Custom":"Contact sales"}</strong><small>Pricing configured to spend volume and scope</small><Link href="/dashboard">{name==="Enterprise"?"Talk to Sales":"Get Started"} <ArrowRight size={15}/></Link><ul>{features.map(feature=><li key={feature}><Check size={15}/>{feature}</li>)}</ul></article>)}</section>
      <section className="performance-pricing"><div><span className="eyebrow">Performance option</span><h2>Pay a percentage of verified recovered savings.</h2><p>Available for eligible recovery categories. Commercial terms are configurable by volume, vertical, complexity, and realized outcome.</p></div><Link className="primary-cta" href="/dashboard">Discuss fit <ArrowRight size={16}/></Link></section>
    </main>
  );
}
