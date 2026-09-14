import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";

/**
 * Refreshes the Supabase session cookie on every request and returns the user (if any).
 * Used by src/proxy.ts; keep it free of business logic.
 */
export async function refreshSession(request: NextRequest) {
  const env = getSupabaseEnv();
  let response = NextResponse.next({ request });
  if (!env) return { response, user: null };

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getUser();
  return { response, user: data.user ?? null };
}
