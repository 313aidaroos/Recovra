import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Support queue · Recovra" };

type SupportRow = {
  id: string;
  support_inbox: string;
  routed_to: string;
  requester_name: string;
  requester_email: string;
  company: string | null;
  category: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

export default async function SupportQueuePage() {
  const supabase = await createServerSupabase();
  if (!supabase) redirect("/support");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/support/queue");
  
  // SECURITY: Support queue is owner-only
  const OWNER_EMAIL = "awad@apixis.dev";
  if (auth.user.email?.toLowerCase().trim() !== OWNER_EMAIL) {
    redirect("/dashboard");
  }

  const { data, error } = await supabase
    .from("support_requests")
    .select("id, support_inbox, routed_to, requester_name, requester_email, company, category, subject, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as SupportRow[];

  return (
    <main className="marketing support-page">
      <nav className="marketing-nav"><Brand/><Link href="/support">Support intake</Link><Link className="nav-cta" href="/dashboard">Dashboard</Link></nav>
      <section className="audit-lab">
        <section className="audit-hero"><span className="sample-label">Owner queue</span><h1>Support routed to awad@apixis.dev.</h1><p>Read-only queue for Recovra support intake. Public requests do not include customer source files and never send recovery claims.</p></section>
        {error ? <p className="form-status error">{error.message}</p> : null}
        <section className="panel document-table">
          <div className="panel-title-row"><div><span className="panel-kicker">recovra@apixis.dev</span><h3>{rows.length} open support record{rows.length === 1 ? "" : "s"}</h3></div></div>
          <div className="table-wrap"><table><thead><tr><th>Created</th><th>Requester</th><th>Category</th><th>Subject</th><th>Status</th><th>Route</th></tr></thead><tbody>
            {rows.map((row) => <tr key={row.id}><td>{formatDateTime(row.created_at)}</td><td><strong>{row.requester_name}</strong><small className="table-sub">{row.requester_email}{row.company ? ` · ${row.company}` : ""}</small></td><td>{row.category}</td><td><strong>{row.subject}</strong><small className="table-sub">{row.message.slice(0, 160)}</small></td><td>{row.status}</td><td>{row.support_inbox} → {row.routed_to}</td></tr>)}
            {rows.length === 0 ? <tr><td colSpan={6}>No routed support requests yet.</td></tr> : null}
          </tbody></table></div>
        </section>
      </section>
    </main>
  );
}
