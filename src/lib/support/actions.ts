"use server";

import { revalidatePath } from "next/cache";
import { createAnonSupabase } from "@/lib/supabase/anon";
import { validateSupportRequest } from "./validate";

export type SupportFormState = { status?: "ok" | "error"; message?: string; id?: string; errors?: Record<string, string> };

export async function createSupportRequestAction(_previous: SupportFormState, formData: FormData): Promise<SupportFormState> {
  const parsed = validateSupportRequest({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company"),
    category: formData.get("category"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (!parsed.ok) return { status: "error", message: "Fix the highlighted fields.", errors: parsed.errors as Record<string, string> };

  const supabase = createAnonSupabase();
  if (!supabase) return { status: "error", message: "Support queue is not configured." };

  const { data, error } = await supabase.rpc("create_support_request", {
    p_name: parsed.value.name,
    p_email: parsed.value.email,
    p_company: parsed.value.company || null,
    p_category: parsed.value.category,
    p_subject: parsed.value.subject,
    p_message: parsed.value.message,
  });

  if (error || !data) return { status: "error", message: error?.message ?? "Could not create support request." };
  revalidatePath("/support");
  return { status: "ok", id: String(data), message: `Support request queued for ${parsed.value.inbox} and routed to ${parsed.value.routeTo}.` };
}
