import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { BuyIxisLink } from "@/components/wallet/buy-ixis-link";
import { RecovraFeed } from "./RecovraFeed";
import "./feed.css";

export const metadata: Metadata = {
  title: "Feed · Recovra",
  description: "Posts from every Apixis company, in one feed.",
};

// Same marketing nav and footer as the home page (src/app/page.tsx); only the Feed link is current.
export default function FeedPage() {
  return (
    <main className="marketing">
      <nav className="marketing-nav">
        <Brand/>
        <div className="marketing-links">
          <Link href="/audit">Sample audit</Link><Link href="/#platform">Platform</Link><Link href="/#industries">Industries</Link><Link href="/#how">How It Works</Link><Link href="/support">Support</Link><Link href="/companies">Apixis Companies</Link><Link href="/feed" aria-current="page">Feed</Link><Link href="/pricing">Pricing</Link><BuyIxisLink returnPath="/pricing" label="Wallet" />
        </div>
        <div className="marketing-actions"><Link href="/login">Login</Link><BuyIxisLink returnPath="/pricing" className="wallet-inline" icon /><Link className="nav-cta" href="/signup">Get Started <ArrowRight size={15}/></Link></div>
      </nav>

      <section className="rv-feed">
        <div className="section-intro rv-feed-intro">
          <span className="eyebrow">Socixis Social · Every Apixis company</span>
          <h1>One feed. <em>Every company.</em></h1>
          <p>What people across the Apixis family are sharing. Sign in with your Apixis ID to post, follow, comment and tip in Ixis.</p>
        </div>
        <RecovraFeed />
      </section>

      <footer id="resources"><Brand/><p>Find overcharges. Recover savings. Control spend.</p><nav><Link href="/audit">Sample audit</Link><Link href="/support">Support</Link><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/pricing">Pricing</Link><BuyIxisLink returnPath="/pricing" label="Wallet" /><Link href="/login">Sign in</Link></nav><span>© 2026 Recovra</span></footer>
    </main>
  );
}
