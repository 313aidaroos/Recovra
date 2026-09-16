import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/** Anonymous server client (publishable key + RLS). No session, no service role. */
export function createAnonSupabase() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createClient(env.url, env.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
