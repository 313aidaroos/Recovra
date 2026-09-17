import type { Metadata } from "next";
import { getWorkspace } from "@/lib/auth/workspace";
import { CixyChat } from "@/components/cixy/chat";

export const metadata: Metadata = { title: "Cixy · Recovery Intelligence · Recovra" };

export default async function CixyPage() {
  const workspace = await getWorkspace();

  if (workspace.mode !== "live") {
    return (
      <main className="marketing">
        <section className="audit-lab">
          <section className="audit-hero">
            <span className="sample-label">Demo mode</span>
            <h1>Sign in to talk to Cixy</h1>
            <p>As-salamu alaykum. I&apos;m available once you&apos;ve created your organization and workspace.</p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="platform">
      <section className="page-heading">
        <div>
          <h1>Recovery Intelligence Assistant</h1>
          <p>Ask Cixy about vendor audits, savings recovery, overcharge detection, and spend optimization.</p>
        </div>
      </section>

      <section className="chat-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <CixyChat organizationName={workspace.organization.name} />
      </section>
    </main>
  );
}
