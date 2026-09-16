import { redirect } from "next/navigation";
import { getWorkspace } from "@/lib/auth/workspace";

export const dynamic = "force-dynamic";

export default async function Ingest() {
  const workspace = await getWorkspace();
  if (workspace.mode === "live") redirect("/documents");
  redirect("/audit");
}
