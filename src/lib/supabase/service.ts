import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Service-role client for the ONE write users must not be able to make themselves: recording a
 * paid plan after the Wallet hold (grant/revoke_plan_entitlement_as_service). Server only.
 * Returns null when SUPABASE_SERVICE_ROLE_KEY is unset; redeem then fails closed and the Wallet
 * hold is released, so nobody is charged.
 */
export function createServiceSupabase() {
  const env = getSupabaseEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !key) return null;
  return createClient(env.url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
