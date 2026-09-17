"use server";

import { requireLiveWorkspace } from "@/lib/auth/workspace";

export interface CixyMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CixyChatState {
  status?: "ok" | "error";
  message?: string;
  messages?: CixyMessage[];
}

export async function sendCixyMessage(_previous: CixyChatState, formData: FormData): Promise<CixyChatState> {
  try {
    // Require live workspace to ensure tenant isolation
    await requireLiveWorkspace();

    const userMessage = String(formData.get("message") ?? "").trim();
    if (userMessage.length === 0) {
      return { status: "error", message: "Enter a message." };
    }

    if (userMessage.length > 4000) {
      return { status: "error", message: "Message must be under 4000 characters." };
    }

    // Call Cixy API endpoint
    const response = await fetch(new URL("/api/cixy/message", process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: userMessage }),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error?: string };
      return { status: "error", message: error?.error ?? "Cixy is temporarily unavailable." };
    }

    const data = (await response.json()) as { message: string };
    const assistantMessage = data.message || "I didn't get a response. Try again.";

    // Preserve conversation history (in real implementation, store in DB)
    const previousMessages = _previous.messages ?? [];
    const updatedMessages: CixyMessage[] = [
      ...previousMessages,
      { role: "user", content: userMessage },
      { role: "assistant", content: assistantMessage },
    ];

    return {
      status: "ok",
      message: assistantMessage,
      messages: updatedMessages,
    };
  } catch (err) {
    console.error("Cixy action error:", err);
    return { status: "error", message: "Something went wrong. Please try again." };
  }
}
