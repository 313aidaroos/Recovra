import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { SupportForm } from "@/components/support/support-form";

export const metadata: Metadata = { title: "Support · Recovra" };

export default function SupportPage() {
  return (
    <main className="marketing support-page">
      <nav className="marketing-nav"><Brand/><Link href="/audit">Sample audit</Link><Link className="nav-cta" href="/login">Sign in <ArrowRight size={15}/></Link></nav>
      <section className="audit-lab">
        <section className="audit-hero"><span className="sample-label">Recovra support</span><h1>Support intake and queue.</h1><p>Ask about account access, document upload, evidence trails, or recovery workflow. Do not paste API keys, passwords, or confidential files into this public form.</p></section>
        <SupportForm/>
      </section>
    </main>
  );
}
