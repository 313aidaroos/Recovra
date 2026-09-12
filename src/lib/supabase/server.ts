import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "./env";

/**
 * Server-side Supabase client bound to the current user's session cookies.
 * Every query runs under RLS as the signed-in user; no elevated privileges exist here.
 */
export async function createServerSupabase() {
  const env = getSupabaseEnv();
  if (!env) return null;
  const cookieStore = await cookies();

  return createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies; the proxy refreshes sessions instead.
        }
      },
    },
  });
}

export type ServerSupabase = NonNullable<Awaited<ReturnType<typeof createServerSupabase>>>;
