import { NextResponse } from "next/server";
import { getSupabaseEnv, isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Liveness + dependency check for uptime monitors. Uses only the publishable key and
 * never returns configuration values, just whether each dependency answered.
 */
export async function GET() {
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

  const healthy = Object.values(checks).every((check) => check.ok) || !isSupabaseConfigured();
  return NextResponse.json(
    { status: healthy ? "ok" : "degraded", mode: isSupabaseConfigured() ? "live" : "demo", checks, uptimeMs: Math.round(process.uptime() * 1000), durationMs: Date.now() - startedAt, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
}
