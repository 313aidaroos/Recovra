"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { redeemIxisAction } from "@/lib/wallet/actions";

export interface RedeemButtonProps {
  planName: string;
  ixisAmount: number;
}

export function RedeemButton({ planName, ixisAmount }: RedeemButtonProps) {
  const [state, action, pending] = useActionState(redeemIxisAction, {});

  return (
    <form action={action} className="redeem-form">
      <input type="hidden" name="plan" value={planName} />
      <input type="hidden" name="ixis_amount" value={ixisAmount} />
      <input type="hidden" name="next" value="/pricing" />
      
      <button type="submit" disabled={pending} className="redeem-button">
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
