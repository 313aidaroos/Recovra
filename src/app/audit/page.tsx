import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { SampleAuditLab } from "@/components/demo/sample-audit-lab";

export const metadata: Metadata = {
  title: "Sample audit",
  description: "Run Recovra’s recovery engine on a labeled sample invoice and rate sheet. Findings include evidence locators and a calculation trail. No claims are sent.",
};

export default function AuditPage() {
  return (
    <main className="marketing audit-page">
      <nav className="marketing-nav">
        <Brand/>
        <div className="marketing-links">
          <Link href="/#how">How it works</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/login">Login</Link>
        </div>
        <div className="marketing-actions">
          <Link href="/login">Sign in</Link>
          <Link className="nav-cta" href="/signup">Get Started <ArrowRight size={15}/></Link>
        </div>
      </nav>
      <SampleAuditLab/>
      <footer>
        <Brand/>
        <p>Demo data is labeled. Monetary findings are calculated from the uploaded or bundled rows.</p>
        <nav>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/templates/recovra-invoice-template.csv">Invoice template</Link>
        </nav>
      </footer>
    </main>
  );
}
