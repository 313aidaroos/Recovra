// Only publishable (browser-safe) credentials live here. RLS enforces tenant isolation,
// so the application never needs a service-role key.
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

export function isSupabaseConfigured() {
  return getSupabaseEnv() !== null;
}
