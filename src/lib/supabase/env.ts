// Change note (Claude, Sep 2026): Reads the service key. See docs/LAUNCH_NOTES.md.
// Only publishable (browser-safe) credentials live here. RLS enforces tenant isolation.
// The single exception is recording a paid plan after a Wallet hold, which uses
// SUPABASE_SERVICE_ROLE_KEY on the server (lib/supabase/service.ts).
//
// The production project's URL and publishable key are committed as defaults so a fresh
// deployment is live without any dashboard configuration. Environment variables override
// them (e.g. for a staging project). Publishable keys are designed to ship in browser
// bundles; they grant nothing beyond what row-level security allows.
const DEFAULT_SUPABASE_URL = "https://ewvgpfufzeyzyutjxuoh.supabase.co";
const DEFAULT_PUBLISHABLE_KEY = "sb_publishable_KzEBzjrfIQJuOmyclqmXnA_keg7Jn4x";

export function getSupabaseEnv() {
  if (process.env.RECOVRA_FORCE_DEMO === "1") return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || DEFAULT_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}
