"use client";

import { useActionState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { sendCixyMessage, type CixyChatState } from "@/lib/cixy/actions";
import { FormStatus } from "@/components/auth/form-status";

export interface CixyChatProps {
  organizationName: string;
}

export function CixyChat({ organizationName }: CixyChatProps) {
  const [state, action, pending] = useActionState(sendCixyMessage, {} as CixyChatState);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state]);

  const handleSubmit = async (_formData: FormData) => {
    await action(new FormData(inputRef.current?.form || undefined));
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <article className="panel cixy-chat-panel">
      <div className="panel-title-row">
        <div>
          <span className="panel-kicker">AI Assistant</span>
          <h3>Cixy — {organizationName}</h3>
        </div>
      </div>

      <div className="cixy-conversation">
        {!state.messages || state.messages.length === 0 ? (
          <div className="cixy-welcome">
            <p className="muted-note">As-salamu alaykum. I'm Cixy, your recovery intelligence specialist. Ask me about overcharge audits, savings recovery, or how to track spend across your vendors.</p>
          </div>
        ) : (
          state.messages.map((msg, idx) => (
            <div key={idx} className={`message message-${msg.role}`}>
              <span className="message-role">{msg.role === "user" ? "You" : "Cixy"}</span>
              <div className="message-body">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form action={handleSubmit} className="cixy-input-form">
        <div className="form-group">
          <textarea
            ref={inputRef}
            name="message"
            placeholder="Ask about vendor contracts, billing issues, or recovery opportunities..."
            rows={3}
            required
            disabled={pending}
          />
          <button type="submit" disabled={pending} className="primary-button">
            <Send size={15} /> {pending ? "Thinking…" : "Ask Cixy"}
          </button>
        </div>
        {state.status === "error" && (
          <FormStatus state={{ error: state.message }} />
        )}
      </form>
    </article>
  );
}
