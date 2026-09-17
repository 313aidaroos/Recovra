"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getWorkspace } from "@/lib/auth/workspace";
import { getCixySystemPrompt } from "@/lib/cixy/prompt";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface CixyRequest {
  message: string;
}

interface CixyResponse {
  message: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export async function POST(req: Request): Promise<Response> {
  try {
    // Check authentication
    const supabase = await createServerSupabase();
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Auth not configured" }), { status: 401 });
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
    }

    // Check workspace context (must be in live mode for a specific organization)
    const workspace = await getWorkspace();
    if (workspace.mode !== "live") {
      return new Response(JSON.stringify({ error: "No organization context" }), { status: 403 });
    }

    // Check API key
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "Service unavailable" }), { status: 503 });
    }

    // Parse request
    const body = (await req.json()) as CixyRequest;
    if (!body.message || body.message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Message field required" }), { status: 400 });
    }

    // Get Cixy system prompt with tenant context
    const systemPrompt = getCixySystemPrompt({
      organizationName: workspace.organization.name,
      tenantId: workspace.organization.id,
    });

    // Call Anthropic Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: body.message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", response.status, error);
      return new Response(JSON.stringify({ error: "AI service error" }), { status: 500 });
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text: string }>;
      usage: { input_tokens: number; output_tokens: number };
    };

    const message = data.content[0]?.text ?? "";

    return new Response(
      JSON.stringify({
        message,
        usage: data.usage,
      } as CixyResponse),
      { status: 200 }
    );
  } catch (err) {
    console.error("Cixy message error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
}
