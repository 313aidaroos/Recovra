// GET /api/wallet/balance → the signed-in person's ONE Apixis Wallet balance for the header pill.
// Ported from Claude's PR #4 / Renoxis app/api/wallet/balance (Grok Recovra Lead, 2026-09-29).
// `linked` = the account signed in with Apixis ID (owner is the Apixis `sub`); otherwise the verified
// email is tried and the pill offers "Link Apixis ID". Never invents a balance: null when unknown.
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { walletBalance, WalletError } from "@/lib/apixis-wallet";
import { apixisSubOf } from "@/lib/apixis-login";
import { apixisWalletBuyUrl } from "@/lib/wallet/embed";

export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET() {
  const buy = apixisWalletBuyUrl("/dashboard");
  const supabase = await createServerSupabase();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return NextResponse.json({ available: null, linked: false, buy, signIn: true }, { status: 401, headers: noStore });
  const sub = apixisSubOf(user);
  const linked = Boolean(sub);
  const owner = sub ?? user.email ?? null;
  if (!owner) return NextResponse.json({ available: null, linked, buy }, { headers: noStore });
  try {
    const balance = await walletBalance(owner, { history: 0 });
    return NextResponse.json({ available: balance.available, currency: balance.currency, linked, buy }, { headers: noStore });
  } catch (error) {
    if (error instanceof WalletError && (error.status === 403 || error.status === 404)) {
      return NextResponse.json({ available: null, linked: false, buy, signInWithApixis: true }, { headers: noStore });
    }
    return NextResponse.json({ available: null, linked, buy, error: "Apixis Wallet is unreachable right now." }, { status: 503, headers: noStore });
  }
}
