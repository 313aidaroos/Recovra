import { NextResponse, type NextRequest } from "next/server";
import { refreshSession } from "@/lib/supabase/proxy";

const AUTH_ONLY_PATHS = ["/onboarding", "/claims"];
const GUEST_ONLY_PATHS = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const { response, user } = await refreshSession(request);
  const { pathname } = request.nextUrl;

  if (!user && AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && GUEST_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|templates/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv)$).*)"],
};
