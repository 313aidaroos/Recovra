import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Boxes,
  Building2,
  Cloud,
  Construction,
  CreditCard,
  FileSearch2,
  Hotel,
  RadioTower,
  ScanSearch,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Truck,
  Zap,
} from "lucide-react";
import { Brand } from "@/components/brand";

const categoryRecoveries = [
  ["Logistics", "$2,418,320"],
  ["Technology", "$1,237,884"],
  ["SaaS", "$934,110"],
  ["Telecom", "$421,339"],
  ["Manufacturing", "$812,665"],
  ["Retail & Hospitality", "$694,221"],
];

const industries = [
  [Truck, "Logistics", "Freight, parcel, 3PL, fleet & more"],
  [Cloud, "Technology", "Cloud, AI, SaaS and software"],
  [RadioTower, "Telecom", "Mobile, internet, fiber and IoT"],
  [ShoppingCart, "Ecommerce", "Marketplaces, fulfillment and payments"],
  [Boxes, "Manufacturing", "Suppliers, materials, equipment and energy"],
  [Construction, "Construction", "Contracts, equipment and materials"],
  [Hotel, "Hospitality", "Hotels, restaurants and multi-location spend"],
  [Building2, "Retail", "Location-level vendors and operations"],
];

export default function Home() {
  return (
    <main className="marketing">
      <nav className="marketing-nav">
        <Brand/>
        <div className="marketing-links">
          <a href="#platform">Platform</a><a href="#industries">Industries</a><a href="#how">How It Works</a><a href="#customers">Customers</a><a href="#resources">Resources</a><Link href="/pricing">Pricing</Link>
        </div>
        <div className="marketing-actions"><Link href="/login">Login</Link><Link className="nav-cta" href="/signup">Get Started <ArrowRight size={15}/></Link></div>
      </nav>

      <section className="hero enterprise-hero">
        <div className="hero-copy">
          <span className="hero-badge"><i/> The recovery intelligence platform</span>
          <h1>Find overcharges.<br/>Recover savings.<br/><em>Control spend.</em></h1>
          <p>Recovra uses AI and automation to audit contracts, invoices, and real-world activity across every vendor—so your team can recover what you’re owed and prevent waste before it happens.</p>
          <div className="hero-actions"><a className="primary-cta" href="#how">See How It Works <ArrowRight size={17}/></a><Link className="ghost-cta" href="/dashboard">Book a Demo</Link></div>
          <div className="hero-proof">
            <div><strong>$1.2B+</strong><small>Illustrative spend monitored</small></div>
            <div><strong>80%</strong><small>Sample time saved</small></div>
            <div><strong>98%</strong><small>Demo retention metric</small></div>
          </div>
        </div>
        <div className="recovery-globe" aria-label="Illustrative global recovery network">
          <div className="globe-orb"><i/><i/><i/><i/><span/><span/></div>
          <article className="hero-recovery-card">
            <div><span>Sample recovery activity</span><small>Demo data</small></div>
            {categoryRecoveries.map(([category, value]) => <p key={category}><span>{category}</span><strong>+{value}</strong></p>)}
            <footer><span>Total recovered</span><strong>$5,518,539</strong></footer>
          </article>
          <div className="hero-signal"><BarChart3 size={22}/><div><strong>Not just audits.</strong><small>A stronger bottom line.</small></div><ArrowRight size={14}/></div>
        </div>
      </section>

      <section className="trust-strip">
        <span>Illustrative enterprise ecosystem</span>
        <div>{["NORTHSTAR","FOUNDRY","NIMBUS","VERIDIAN","DATADESK","RAPID","SUMMIT","MERIDIAN"].map((name) => <strong key={name}>{name}</strong>)}</div>
      </section>

      <section className="how-grid" id="how">
        {[
          [ScanSearch, "Detect Issues", "AI analyzes contracts, invoices and actual usage across all vendors."],
          [Zap, "Recover Faster", "We generate the evidence and help recover what you’re owed."],
          [ShieldCheck, "Prevent Waste", "Monitor continuously and stop overcharges before they happen."],
          [BarChart3, "Optimize Spend", "Turn recovery into long-term savings and stronger vendor terms."],
        ].map(([Icon, title, description]) => (
          <article key={title as string}><Icon size={31}/><h3>{title as string}</h3><p>{description as string}</p></article>
        ))}
      </section>

      <section className="platform-preview-section" id="platform">
        <div className="section-intro"><span className="eyebrow">The command center</span><h2>Every dollar, under control.</h2><p>A complete view of spend monitored, recovery opportunities, realized value, and future waste prevented.</p></div>
        <div className="browser-frame">
          <div className="browser-top"><i/><i/><i/><span>app.recovra.com/dashboard · sample workspace</span></div>
          <div className="preview-app">
            <aside><Brand/><nav><strong><BarChart3 size={13}/> Command Center</strong><span><ShieldCheck size={13}/> Opportunities</span><span><FileSearch2 size={13}/> Invoices</span><span><CreditCard size={13}/> Contracts</span><span><Boxes size={13}/> Vendors</span><span><Bot size={13}/> Industry Modules</span></nav></aside>
            <section>
              <header><div><small>Welcome back, John.</small><h3>Command Center</h3></div><button>Upload documents</button></header>
              <div className="preview-metrics">{[["Spend monitored","$18,420,319"],["Recovery opportunities","$746,210"],["Recovered","$481,904"],["Prevented","$182,640"]].map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong><span>↑ sample trend</span></div>)}</div>
              <div className="preview-grid"><article><strong>Recovery trend</strong><div className="preview-chart"><svg viewBox="0 0 500 150" preserveAspectRatio="none"><path d="M0 130 L55 101 L110 111 L165 82 L220 91 L275 58 L330 69 L385 35 L440 49 L500 15 L500 150 L0 150 Z"/><polyline points="0,130 55,101 110,111 165,82 220,91 275,58 330,69 385,35 440,49 500,15"/></svg></div></article><article><strong>Top opportunities</strong>{categoryRecoveries.slice(0,4).map(([name,value])=><p key={name}><span>{name}</span><b>{value}</b></p>)}</article></div>
            </section>
          </div>
        </div>
      </section>

      <section className="industry-section" id="industries">
        <div className="section-intro row"><div><span className="eyebrow">Built for every industry</span><h2>One platform. Every dollar.</h2><p>The same recovery engine adapts to the documents, usage, and rules that define each spend category.</p></div><Link href="/modules">Explore all industries <ArrowRight size={16}/></Link></div>
        <div className="industry-card-grid">{industries.map(([Icon,name,description])=><article key={name as string}><Icon size={24}/><strong>{name as string}</strong><small>{description as string}</small></article>)}</div>
      </section>

      <section className="enterprise-cta" id="customers">
        <div className="cta-quote"><Sparkles size={22}/><blockquote>“The strongest recovery programs connect every finding to proof, ownership, and a measurable outcome.”</blockquote><span>Illustrative customer outcome · not a customer testimonial</span></div>
        <div><span className="eyebrow">Turn expenses into opportunities</span><h2>Stop leaving money<br/>on the table.</h2><p>Join the companies using Recovra’s operating model to recover more, control spend, and build a stronger bottom line.</p><div className="hero-actions"><Link className="primary-cta" href="/signup">Get Started <ArrowRight size={16}/></Link><Link className="ghost-cta" href="/dashboard">Talk to Sales</Link></div></div>
      </section>

      <footer id="resources"><Brand/><p>Find overcharges. Recover savings. Control spend.</p><nav><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/pricing">Pricing</Link><Link href="/login">Sign in</Link></nav><span>© 2026 Recovra</span></footer>
    </main>
  );
}
