export const OWNER_EMAIL = "awad@apixis.dev";

const OTP_TYPES = new Set(["signup", "magiclink", "recovery", "email_change"]);

export function safeNextPath(value: FormDataEntryValue | string | null, fallback = "/dashboard") {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export function magicLinkRedirect(origin: string, next: string | null | undefined = "/dashboard") {
  const url = new URL("/auth/callback", origin);
  url.searchParams.set("next", safeNextPath(next ?? null));
  return url.toString();
}

export type AuthCallbackTarget =
  | { kind: "code"; code: string; next: string }
  | { kind: "token_hash"; tokenHash: string; type: string; next: string }
  | { kind: "error"; reason: string };

export function authCallbackTarget(searchParams: URLSearchParams): AuthCallbackTarget {
  const providerError = searchParams.get("error_code") || searchParams.get("error");
  if (providerError) return { kind: "error", reason: providerError };

  const next = safeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  if (code) return { kind: "code", code, next };

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") ?? "";
  if (tokenHash && OTP_TYPES.has(type)) return { kind: "token_hash", tokenHash, type, next };

  return { kind: "error", reason: "link_invalid" };
}
