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
      
      <button type="submit" disabled={pending} className="redeem-button">
        {pending ? "Processing…" : `Redeem · ${ixisAmount.toLocaleString()} Ixis`} <ArrowRight size={15}/>
      </button>

      {state.status === "pending" && (
        <p className="wallet-status pending">{state.message}</p>
      )}
      {state.status === "error" && (
        <p className="wallet-status error">{state.message}</p>
      )}
      {state.status === "success" && (
        <p className="wallet-status success">Redeemed! Subscription active.</p>
      )}
    </form>
  );
}
