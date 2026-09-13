import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Brand } from "@/components/brand";
import { legalConfig } from "@/lib/legal";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

export function LegalLayout({ eyebrow, title, intro, sections }: { eyebrow: string; title: string; intro: string; sections: LegalSection[] }) {
  return (
    <main className="legal-page">
      <nav className="marketing-nav"><Brand/><Link href="/">Back to platform</Link><Link className="nav-cta" href="/signup">Get Started <ArrowRight size={15}/></Link></nav>
      <section className="legal-hero">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{intro}</p>
        <p style={{ marginTop: 10, fontSize: 12 }}>Last updated {legalConfig.lastUpdated} · Operated by {legalConfig.legalEntity}</p>
        <div className="legal-toc">{sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}</div>
      </section>
      <article className="legal-body">
        {sections.map((section) => (
          <section key={section.id} id={section.id}>
            <h2>{section.title}</h2>
            {section.body}
          </section>
        ))}
      </article>
      <footer className="legal-footer">
        <span>© 2026 {legalConfig.legalEntity}</span>
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <a href={`mailto:${legalConfig.contactEmail}`}>{legalConfig.contactEmail}</a>
      </footer>
    </main>
  );
}
