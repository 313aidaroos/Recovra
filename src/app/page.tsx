import Link from "next/link";
import { ArrowRight, Bot, CheckCircle2, Cloud, CreditCard, FileSearch2, ReceiptText, ScanSearch, ShieldCheck, Truck } from "lucide-react";
import { Brand } from "@/components/brand";

export default function Home(){
 return <main className="marketing">
  <nav className="marketing-nav"><Brand/><div className="marketing-links"><a href="#platform">Platform</a><a href="#modules">Modules</a><a href="#how">How it works</a></div><Link className="nav-cta" href="/dashboard">Open demo <ArrowRight size={15}/></Link></nav>
  <section className="hero">
   <div className="hero-glow"/><div className="hero-copy"><span className="hero-badge"><i/> Recovery intelligence for every dollar</span><h1>Stop paying for <em>what you never owed.</em></h1><p>Recovra compares contracts, invoices and real-world usage to find financial leakage, prove it, recover it and stop it from happening again.</p><div className="hero-actions"><Link className="primary-cta" href="/dashboard">Explore command center <ArrowRight size={17}/></Link><a className="ghost-cta" href="#how">See how it works</a></div><div className="trust-row"><span><CheckCircle2 size={15}/> Evidence-backed</span><span><CheckCircle2 size={15}/> Multi-vertical</span><span><CheckCircle2 size={15}/> Built for prevention</span></div></div>
   <div className="hero-console"><div className="console-top"><span><i/> Live recovery feed</span><small>Demo environment</small></div><div className="console-money"><small>Value protected this quarter</small><strong>$664,544</strong><span>+27.4% vs prior quarter</span></div><div className="console-grid"><div><small>Recovered</small><strong>$481.9K</strong></div><div><small>Prevented</small><strong>$182.6K</strong></div></div><div className="console-event"><span className="event-icon"><ScanSearch size={18}/></span><div><strong>$24,180 opportunity verified</strong><small>NorthStar Parcel · fuel surcharge mismatch</small></div><span>98%</span></div><div className="console-event"><span className="event-icon"><ShieldCheck size={18}/></span><div><strong>$8,440 future spend prevented</strong><small>SaaS renewal · 126 inactive seats</small></div><span>Saved</span></div></div>
  </section>
  <section className="platform-strip" id="platform"><span>ONE RECOVERY ENGINE</span><div>{[[Truck,"Logistics"],[Bot,"AI Spend"],[Cloud,"Cloud"],[ReceiptText,"AP"],[CreditCard,"Payments"],[FileSearch2,"Contracts"]].map(([Icon,label]:any)=><div key={label}><Icon size={20}/>{label}</div>)}</div></section>
  <section className="feature-section" id="how"><div className="section-head"><span className="eyebrow">The Recovra loop</span><h2>From messy spend to money recovered.</h2><p>One workflow, reused across industries.</p></div><div className="step-grid">{[
   ["01","Connect","Invoices, contracts, rate sheets, POs and operational data."],
   ["02","Reconcile","Calculate expected cost from terms and actual activity."],
   ["03","Prove","Attach source evidence and a reproducible calculation trail."],
   ["04","Recover","Create, approve and track the claim to realized value."],
   ["05","Prevent","Run the same controls before payment and renewal."],
  ].map(([n,t,d])=><article key={n}><span>{n}</span><h3>{t}</h3><p>{d}</p></article>)}</div></section>
  <section className="wide-cta" id="modules"><div><span className="eyebrow">Built to expand</span><h2>Freight is the wedge. Recovery is the platform.</h2><p>Start where the pain is obvious, then extend the same engine across technology, procurement, payments, utilities, manufacturing and multi-location operations.</p></div><Link href="/modules">Explore 18 modules <ArrowRight size={17}/></Link></section>
  <footer><Brand/><p>Find overcharges. Recover savings. Control spend.</p><span>© 2026 Recovra</span></footer>
 </main>
}
