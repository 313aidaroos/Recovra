"use client";

import { useActionState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { createSupportRequestAction, type SupportFormState } from "@/lib/support/actions";
import { SUPPORT_INBOX, SUPPORT_ROUTE_TO } from "@/lib/support/validate";
import { FormStatus } from "@/components/auth/form-status";

const initial: SupportFormState = {};

export function SupportForm() {
  const [state, action, pending] = useActionState(createSupportRequestAction, initial);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // Let the server action handle it via form action attribute
    // But log that we're submitting
    console.log('[SupportForm] Submitting form', { pending, state });
  };
  
  return (
    <section className="support-grid">
      <article className="panel upload-panel">
        <div className="panel-title-row"><div><span className="panel-kicker">Support intake</span><h3>Ask Recovra support</h3></div><LifeBuoy size={20}/></div>
        <form action={action} onSubmit={handleSubmit} className="workflow-form">
          <label className="field-label">Name<input name="name" required placeholder="Your name"/></label>
          <label className="field-label">Work email<input name="email" type="email" required placeholder="you@company.com"/></label>
          <label className="field-label">Company <small>optional</small><input name="company" placeholder="Company name"/></label>
          <label className="field-label">Category
            <select name="category" defaultValue="billing_audit">
              <option value="billing_audit">Billing audit / finding</option>
              <option value="document_upload">Document upload</option>
              <option value="recovery_workflow">Recovery workflow</option>
              <option value="account_access">Account access</option>
              <option value="security">Security</option>
              <option value="general">General</option>
            </select>
          </label>
          <label className="field-label">Subject<input name="subject" required placeholder="How can we help?"/></label>
          <label className="field-label">Message<textarea name="message" required minLength={20} rows={6} placeholder="Include invoice number, vendor, or finding ID if you have one. Do not paste secrets."/></label>
          <FormStatus state={{ error: state.status === "error" ? state.message : undefined, message: state.status === "ok" ? state.message : undefined }}/>
          <button className="primary-button wide" type="submit" disabled={pending}><Send size={15}/> {pending ? "Queuing…" : "Send to support queue"}</button>
        </form>
      </article>
      <article className="panel">
        <span className="panel-kicker">Routing</span>
        <h3>{SUPPORT_INBOX}</h3>
        <p className="muted-note">Requests enter Recovra’s support queue and are routed to {SUPPORT_ROUTE_TO}. Customer audit files stay tenant-isolated in the signed-in workspace; this public form stores only the support message.</p>
        <p className="muted-note">No recovery claims are sent from support intake. Claim packets still require authenticated human approval.</p>
      </article>
    </section>
  );
}
