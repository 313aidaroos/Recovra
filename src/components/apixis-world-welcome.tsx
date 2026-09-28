"use client";
// One-time "Your agent is ready. Enter the Apixis world" card on the Recovra Command Center.
// The agent is created server-side by GET /api/apixis/world-agent on the first signed-in load.
// Cixy is the guide, never the person's avatar. Grok Developer Bot, 2026-09-28.
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

type View = { ok: boolean; status: "ready" | "invite"; agentName: string | null; showWelcome: boolean; enterUrl: string };

function markSeen(action: "enter" | "dismiss") {
  try {
    void fetch("/api/apixis/world-agent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

const chip: React.CSSProperties = { border: "1px solid var(--line)", background: "var(--panel2)", color: "var(--text)", borderRadius: 999, padding: "4px 11px", fontSize: 12, fontWeight: 700 };

export function ApixisWorldWelcome() {
  const [view, setView] = useState<View | null>(null);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/apixis/world-agent", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((v) => { if (!cancelled && v?.ok) setView(v); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  if (!view?.showWelcome) return null;
  const ready = view.status === "ready";
  return (
    <section
      aria-labelledby="rv-agent-title"
      data-state={view.status}
      className="panel"
      style={{ position: "relative", overflow: "hidden", marginBottom: 26, padding: 22, borderColor: "#2c5a44", background: "linear-gradient(135deg,#0e1b16 0%,#0c1713 60%,#10251c 100%)" }}
    >
      <div aria-hidden style={{ position: "absolute", inset: "0 0 auto 0", height: 2, background: "linear-gradient(90deg,var(--green),var(--green2),transparent)" }} />
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 22 }}>
        <figure style={{ margin: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/cixy/cixy-combo-a-avatar.webp" alt="Cixy, your guide" width={84} height={84} style={{ width: 84, height: 84, borderRadius: 14, objectFit: "cover", border: "1px solid #2c5a44", background: "var(--bg2)" }} />
          <figcaption style={{ fontSize: 10, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", textAlign: "center", fontWeight: 800 }}>
            <span style={{ display: "block", color: "var(--green)" }}>Cixy</span>your guide
          </figcaption>
        </figure>
        <div style={{ flex: "1 1 320px", minWidth: 0 }}>
          <span className="eyebrow"><Sparkles size={14} /> {ready ? "Apixis world · your agent is ready" : "Apixis world · your own agent"}</span>
          <h2 id="rv-agent-title" style={{ fontSize: 24, letterSpacing: "-1px", margin: "9px 0 6px", color: "var(--text)" }}>
            {ready ? "Your agent is ready. Enter the Apixis world." : "Your own agent is waiting in the Apixis world."}
          </h2>
          <p style={{ margin: 0, color: "#778d82", fontSize: 13, lineHeight: 1.6, maxWidth: 680 }}>
            {ready
              ? "Your Recovra account came with your own agent in the Apixis world. It starts in the default Apixis body. Pick its hair, outfit and colors once you're inside. I'll meet you there and show you around."
              : "Every Recovra account gets its own agent in the Apixis world. Sign in with Apixis ID and it's created for you, in the default Apixis body you can make your own."}
          </p>
          <ul aria-label="Your agent" style={{ listStyle: "none", padding: 0, margin: "14px 0 0", display: "flex", flexWrap: "wrap", gap: 8 }}>
            <li style={{ ...chip, background: "var(--green)", color: "var(--ink)", borderColor: "var(--green)" }}>✦ {ready && view.agentName ? view.agentName : "Your agent"}</li>
            <li style={chip}>200 in-world Ixis to start</li>
            <li style={chip}>Sign in with Apixis ID</li>
          </ul>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: "0 0 220px" }}>
          <a className="primary-button" href={view.enterUrl} onClick={() => markSeen("enter")} style={{ height: 40 }}>
            Enter the Apixis world ↗
          </a>
          <button type="button" className="secondary-button" style={{ height: 40, width: "100%", justifyContent: "center" }} onClick={() => { markSeen("dismiss"); setView({ ...view, showWelcome: false }); }}>
            Not now
          </button>
          <small style={{ textAlign: "center", color: "var(--muted)", fontSize: 11 }}>You can come back to Recovra anytime.</small>
        </div>
      </div>
    </section>
  );
}
