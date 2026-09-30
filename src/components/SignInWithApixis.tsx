// "Log in with Apixis ID": one account for Recovra, Apixis Wallet and every Apixis company.
// Ported from Claude's PR #4 (SignInWithApixis) with the Renoxis login wording. Keeps ?next=.
// Grok Recovra Lead, 2026-09-29.
export function SignInWithApixis({ next = "/dashboard", signup = false }: { next?: string; signup?: boolean }) {
  const href = `/auth/apixis/start?next=${encodeURIComponent(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard")}`;
  const note = signup
    ? "One account for Recovra, Apixis Wallet and every Apixis company. New here? Your account comes with your own Apixis world agent and 1000 Ixis to start."
    : "One account for Recovra, Apixis Wallet and every Apixis company.";
  return (
    <div className="apixis-login">
      <a className="primary-button wide" href={href}>Log in with Apixis ID</a>
      <p className="muted-note">{note}</p>
      <div className="auth-divider"><span>or use your Recovra email</span></div>
    </div>
  );
}
