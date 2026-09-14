import { ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="auth-page">
      <section className="auth-panel">
        <Brand/>
        <div className="auth-panel-copy">
          <span className="eyebrow">Recovery Intelligence Platform</span>
          <h1>Find overcharges. Recover savings. Control spend.</h1>
          <p>Upload contracts, rate sheets and invoices. Recovra audits every line deterministically, links the evidence, and routes each recovery through human approval.</p>
          <ul>
            <li><ShieldCheck size={15}/> Tenant isolation enforced with row-level security</li>
            <li><ShieldCheck size={15}/> Private document storage with SHA-256 provenance</li>
            <li><ShieldCheck size={15}/> No claim leaves Recovra without an approver</li>
          </ul>
        </div>
      </section>
      <section className="auth-card-wrap">
        <div className="auth-card">{children}</div>
      </section>
    </main>
  );
}
