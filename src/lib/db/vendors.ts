import type { LiveWorkspace } from "@/lib/auth/workspace";
import type { VendorRow } from "./types";

/** Finds a vendor by case-insensitive name inside the active organization, creating it when missing. */
export async function ensureVendor(workspace: LiveWorkspace, name: string, category = "logistics"): Promise<VendorRow> {
  const { supabase, organization } = workspace;
  const trimmed = name.trim();
  const { data: existing } = await supabase
    .from("vendors").select("*").eq("organization_id", organization.id).ilike("name", trimmed).limit(1).maybeSingle();
  if (existing) return existing as VendorRow;

  const { data: created, error } = await supabase
    .from("vendors").insert({ organization_id: organization.id, name: trimmed, category }).select("*").single();
  if (error || !created) throw new Error(`Could not create vendor "${trimmed}": ${error?.message ?? "unknown"}`);
  return created as VendorRow;
}
