// Wallet SSO returns here (registered: https://recovra-three.vercel.app/auth/apixis/callback).
// Missing/bad params or a stale state cookie redirect to /login?error=… inside finishApixisLogin;
// anything unexpected also lands on /login with an error, never a 404/500 (Grok Recovra Lead, 2026-09-29).
import { NextResponse } from "next/server";
import { finishApixisLogin } from "@/lib/apixis-login";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return await finishApixisLogin(request);
  } catch (error) {
    console.error("Apixis ID callback failed:", (error as Error)?.message ?? "");
    return NextResponse.redirect(new URL("/login?error=apixis_error", request.url), 302);
  }
}
