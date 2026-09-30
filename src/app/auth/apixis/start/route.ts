// "Log in with Apixis ID" → Wallet /sso/authorize (client APIXIS_CLIENT_ID, callback /auth/apixis/callback).
import { startApixisLogin } from "@/lib/apixis-login";

export const dynamic = "force-dynamic";
export const GET = startApixisLogin;
