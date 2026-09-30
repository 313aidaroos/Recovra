"use client";

import { useActionState, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { redeemIxisAction, type WalletRedeemState } from "@/lib/wallet/actions";

export interface RedeemButtonProps {
  planName: string;
  ixisAmount: number;
}

export function RedeemButton({ planName, ixisAmount }: RedeemButtonProps) {
  const attempt = useRef("");
  const [state, action, pending] = useActionState(async (previous: WalletRedeemState, form: FormData) => {
    const key = `recovra-purchase:${planName}`;
    if (!attempt.current) {
      try { attempt.current = sessionStorage.getItem(key) || ""; } catch { /* optional storage */ }
      if (!/^[a-zA-Z0-9-]{16,64}$/.test(attempt.current)) attempt.current = crypto.randomUUID();
      try { sessionStorage.setItem(key, attempt.current); } catch { /* retry still uses the ref */ }
    }
    form.set("attemptId", attempt.current);
    const result = await redeemIxisAction(previous, form);
    if (result.status === "success") {
      try { sessionStorage.removeItem(key); } catch { /* optional storage */ }
    }
    return result;
  }, {});

  return (
    <form action={action} className="redeem-form">
      <input type="hidden" name="plan" value={planName} />
      <input type="hidden" name="ixis_amount" value={ixisAmount} />
      <input type="hidden" name="next" value="/pricing" />
      
      <button type="submit" disabled={pending || state.status === "success"} className="redeem-button">
        {pending ? "Processing…" : `Redeem · ${ixisAmount.toLocaleString()} Ixis`} <ArrowRight size={15}/>
      </button>

      {state.status === "insufficient" && state.buyUrl && (
        <p className="wallet-status pending">
          {state.message}{" "}
          <a href={state.buyUrl} className="buy-ixis-link">
            Buy Ixis →
          </a>
        </p>
      )}
      {state.status === "error" && (
        <p className="wallet-status error">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="wallet-status success">{state.message}</p>
      )}
    </form>
  );
}
