import { NextResponse, type NextRequest } from "next/server";
import { authCallbackTarget } from "@/lib/auth/redirects";
import { createServerSupabase } from "@/lib/supabase/server";

/** Exchanges confirmation / magic-link params for a session. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const target = authCallbackTarget(searchParams);

  if (target.kind !== "error") {
    const supabase = await createServerSupabase();
    if (supabase) {
      const outcome = target.kind === "code"
        ? await supabase.auth.exchangeCodeForSession(target.code)
        : await supabase.auth.verifyOtp({ token_hash: target.tokenHash, type: target.type as "signup" | "magiclink" | "recovery" | "email_change" });
      if (!outcome.error) return NextResponse.redirect(`${origin}${target.next}`);
    }
  }

  const reason = target.kind === "error" ? target.reason : "link_invalid";
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(reason)}`);
}
