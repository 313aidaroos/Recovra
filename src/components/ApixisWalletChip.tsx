"use client";
// Header pill: the person's ONE Apixis Wallet Ixis balance, on every signed-in platform page.
// Ported from Claude's PR #4 (ApixisWalletChip) with the Renoxis WalletPill conventions
// (✦ N Ixis, "Link Apixis ID" when the account isn't linked yet, refetch on focus/back so the number
// updates right after a Wallet purchase). Grok Recovra Lead, 2026-09-29.
import { useEffect, useState } from "react";
import { APIXIS_WALLET_ORIGIN } from "@/lib/wallet/embed";

type WalletState = { available: number | null; linked: boolean; loaded: boolean };

function useWalletState(): WalletState {
  const [state, setState] = useState<WalletState>({ available: null, linked: false, loaded: false });
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const load = () => {
      if (inFlight) return;
      inFlight = true;
      fetch("/api/wallet/balance", { cache: "no-store", credentials: "same-origin" })
        .then((response) => (response.status === 401 ? null : response.json().catch(() => null)))
        .then((data) => {
          if (cancelled || !data) return;
          setState({ available: typeof data.available === "number" ? data.available : null, linked: data.linked === true, loaded: true });
        })
        .catch(() => undefined)
        .finally(() => { inFlight = false; });
    };
    const onVisible = () => { if (document.visibilityState === "visible") load(); };
    load();
    window.addEventListener("focus", load);
    window.addEventListener("pageshow", load);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", load);
      window.removeEventListener("pageshow", load);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
  return state;
}

export function ApixisWalletChip({ next = "/dashboard" }: { next?: string }) {
  const wallet = useWalletState();
  const label = wallet.available === null ? "—" : wallet.available.toLocaleString();
  return (
    <span className="wallet-pill-group">
      <a
        className="wallet-pill"
        href={APIXIS_WALLET_ORIGIN}
        title="Your Apixis Wallet balance"
        aria-label={`Apixis Wallet: ${wallet.available === null ? "balance unavailable" : `${label} Ixis`}`}
      >
        <span aria-hidden="true">✦</span> {label} Ixis
      </a>
      {wallet.loaded && !wallet.linked && (
        <a className="wallet-pill-link" href={`/auth/apixis/start?next=${encodeURIComponent(next)}`} title="Link your Apixis ID to see your Apixis Wallet balance here">
          Link Apixis ID
        </a>
      )}
    </span>
  );
}
