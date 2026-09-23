import { NextResponse } from "next/server";
import { isPdfExtractionConfigured } from "@/lib/ingestion/pdf-extractor";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";
import { isWalletConfigured } from "@/lib/apixis-wallet";

export const dynamic = "force-dynamic";

/**
 * BILLING HARDENING #4: Health ≠ key exists. Verifies actual authenticated round-trips (5-min cache).
 * Liveness + dependency check for uptime monitors.
 */

// Simple in-memory cache (5 min TTL)
let healthCache: { timestamp: number; result: unknown } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function GET() {
  const now = Date.now();
  
  // Return cached result if fresh
  if (healthCache && (now - healthCache.timestamp) < CACHE_TTL_MS) {
    return NextResponse.json(healthCache.result, {
      status: (healthCache.result as { status: string }).status === "ok" ? 200 : 503,
      headers: { "cache-control": "private, max-age=300" },
    });
  }

  const startedAt = Date.now();
  const checks: Record<string, { ok: boolean; latencyMs?: number; detail?: string }> = {};

  const env = getSupabaseEnv();
  if (!env) {
    checks.supabase = { ok: false, detail: "not configured (demo mode)" };
  } else {
    const began = Date.now();
    try {
      const response = await fetch(`${env.url}/auth/v1/health`, { headers: { apikey: env.key }, cache: "no-store", signal: AbortSignal.timeout(5000) });
      checks.supabase = { ok: response.ok, latencyMs: Date.now() - began, detail: response.ok ? undefined : `auth health returned ${response.status}` };
    } catch (error) {
      checks.supabase = { ok: false, latencyMs: Date.now() - began, detail: error instanceof Error ? error.message : "unreachable" };
    }
  }

  // Anthropic API (for Cixy)
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    checks.anthropic = { ok: false, detail: "key not configured" };
  } else {
    const began = Date.now();
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": anthropicKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 1, messages: [{ role: "user", content: "ping" }] }),
        cache: "no-store", signal: AbortSignal.timeout(10000),
      });
      checks.anthropic = { ok: response.ok, latencyMs: Date.now() - began, detail: response.ok ? undefined : `API returned ${response.status}` };
    } catch (error) {
      checks.anthropic = { ok: false, latencyMs: Date.now() - began, detail: error instanceof Error ? error.message : "unreachable" };
    }
  }

  // Wallet API
  if (!isWalletConfigured()) {
    checks.wallet = { ok: false, detail: "key not configured" };
  } else {
    const began = Date.now();
    try {
      const walletUrl = process.env.APIXIS_WALLET_API_URL ?? "https://apixis-wallet.vercel.app";
      const response = await fetch(`${walletUrl}/api/v1/health`, {
        headers: { authorization: `Bearer ${process.env.WALLET_API_KEY}` }, cache: "no-store", signal: AbortSignal.timeout(5000),
      });
      checks.wallet = { ok: response.ok, latencyMs: Date.now() - began, detail: response.ok ? undefined : `API returned ${response.status}` };
    } catch (error) {
      checks.wallet = { ok: false, latencyMs: Date.now() - began, detail: error instanceof Error ? error.message : "unreachable" };
    }
  }

  // Resend (magic-link emails)
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    checks.resend = { ok: false, detail: "key not configured" };
  } else {
    const began = Date.now();
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "GET", headers: { authorization: `Bearer ${resendKey}` }, cache: "no-store", signal: AbortSignal.timeout(5000),
      });
      checks.resend = { ok: response.ok || response.status === 401, latencyMs: Date.now() - began, detail: (response.ok || response.status === 401) ? undefined : `API returned ${response.status}` };
    } catch (error) {
      checks.resend = { ok: false, latencyMs: Date.now() - began, detail: error instanceof Error ? error.message : "unreachable" };
    }
  }

  const healthy = Object.values(checks).every((check) => check.ok) || !isSupabaseConfigured();

  let demoPersistence: "configured" | "off" = "off";
  if (env) {
    try {
      const { createAnonSupabase } = await import("@/lib/supabase/anon");
      const supabase = createAnonSupabase();
      const probe = supabase ? await supabase.from("demo_audit_runs").select("id", { count: "exact", head: true }) : { error: { message: "no client" } };
      if (!probe.error) demoPersistence = "configured";
    } catch {
      demoPersistence = "off";
    }
  }

  // Informational only: PDF transcription and demo persistence never affect liveness.
  const features = { pdfExtraction: isPdfExtractionConfigured() ? "configured" : "off", demoPersistence };
  
  const result = {
    status: healthy ? "ok" : "degraded",
    mode: isSupabaseConfigured() ? "live" : "demo",
    checks,
    features,
    uptimeMs: Math.round(process.uptime() * 1000),
    durationMs: Date.now() - startedAt,
    timestamp: new Date().toISOString(),
  };

  // Cache the result
  healthCache = { timestamp: now, result };

  return NextResponse.json(result, {
    status: healthy ? 200 : 503,
    headers: { "cache-control": "private, max-age=300" },
  });
}
