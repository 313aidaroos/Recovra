import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** 
 * FAMILY STANDARD: Exchanges confirmation / magic-link params for a session.
 * Handles PKCE flow (?code=) and implicit flow (#access_token) via client-side fallback.
 * Preserves `next` end-to-end (same-origin only).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const rawNext = searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(`${origin}/login?error=auth_not_configured`);
  }

  // PKCE flow (server-side)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error("PKCE exchange failed:", error);
      return NextResponse.redirect(`${origin}/login?error=link_invalid`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Implicit flow token_hash (magic link)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ 
      token_hash: tokenHash, 
      type: type as "signup" | "magiclink" | "recovery" | "email_change" 
    });
    if (error) {
      console.error("OTP verify failed:", error);
      return NextResponse.redirect(`${origin}/login?error=link_invalid`);
    }
    return NextResponse.redirect(`${origin}${next}`);
  }

  // No server-side params: implicit flow tokens arrive in #hash on client side.
  // Mount a hash handler on this page or redirect to login with client-side fallback.
  return NextResponse.redirect(`${origin}/login?error=link_invalid`);
}
