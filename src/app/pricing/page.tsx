import Link from "next/link";
import { ArrowRight, Check, Wallet } from "lucide-react";
import { Brand } from "@/components/brand";
import { BuyIxisLink } from "@/components/wallet/buy-ixis-link";
import { RedeemButton } from "@/components/wallet/redeem-button";

const plans = [
  ["Starter","For smaller businesses building a repeatable recovery process.",["Core recovery dashboard","Invoice and contract uploads","Logistics + AP starter modules","Evidence packages"],"22,000","$220"],
  ["Growth","For growing organizations with fragmented multi-vendor spend.",["Everything in Starter","Multiple industry modules","Recovery workflows and approvals","Advanced reporting"],"44,000","$440"],
  ["Enterprise","For complex organizations requiring controls, scale, and custom connectivity.",["Everything in Growth","SSO / SCIM roadmap","Custom rules and integrations","Advanced RBAC and support"],null,null],
] as const;

export default function PricingPage() {
  return (
    <main className="pricing-page">
      <nav className="marketing-nav">
        <Brand/>
        <div className="marketing-links">
          <Link href="/">Platform</Link>
          <BuyIxisLink returnPath="/pricing" label="Wallet" />
        </div>
        <div className="marketing-actions">
          <Link href="/dashboard">Get Started</Link>
          <BuyIxisLink returnPath="/pricing" className="nav-cta" icon />
        </div>
      </nav>
      <section className="pricing-hero">
        <span className="eyebrow">Ixis-based pricing</span>
        <h1>Start with proof. Scale with recovery.</h1>
        <p>Pay with Ixis points from your Apixis Wallet. 100 Ixis = $1. Paid Ixis never expires.</p>
        <div className="pricing-buy">
          <BuyIxisLink returnPath="/pricing" className="primary-cta" icon />
        </div>
        <div className="pricing-note">
          <Wallet size={16}/>
          <span>Cash is charged only in Apixis Wallet. Return here to redeem a plan. Recovra does not run card checkout for Ixis.</span>
        </div>
      </section>
      <section className="pricing-grid">
        {plans.map(([name,description,features,ixisPrice,dollarEquiv],index)=>(
          <article className={index===1?"featured":""} key={name}>
            {index===1&&<span className="popular">Most flexible</span>}
            <h2>{name}</h2>
            <p>{description}</p>
            {ixisPrice ? (
              <>
                <strong>{ixisPrice} Ixis/mo</strong>
                <small>{dollarEquiv} equivalent</small>
              </>
            ) : (
              <>
                <strong>Custom</strong>
                <small>Pricing configured to spend volume and scope</small>
              </>
            )}
            {name === "Enterprise" ? (
              <Link href="/dashboard" className="redeem-button">
                Talk to Sales <ArrowRight size={15}/>
              </Link>
            ) : (
              <RedeemButton planName={name} ixisAmount={parseInt((ixisPrice || "0").replace(/,/g, ""), 10)} />
            )}
            <ul>{features.map(feature=><li key={feature}><Check size={15}/>{feature}</li>)}</ul>
          </article>
        ))}
      </section>
      <section className="performance-pricing">
        <div>
          <span className="eyebrow">Performance option</span>
          <h2>Pay a percentage of verified recovered savings.</h2>
          <p>Available for eligible recovery categories. Commercial terms are configurable by volume, vertical, complexity, and realized outcome. Settled in Ixis per successful claim cycle.</p>
        </div>
        <Link className="primary-cta" href="/dashboard">Discuss fit <ArrowRight size={16}/></Link>
      </section>
    </main>
  );
}
