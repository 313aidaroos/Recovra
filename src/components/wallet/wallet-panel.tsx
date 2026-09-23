import type { WalletReturnPath } from "@/lib/wallet/embed";
import { StatusBadge } from "../ui/status-badge";
import { BuyIxisLink } from "./buy-ixis-link";
import { ApixisWalletChip } from "@/components/ApixisWalletChip";

export function WalletPanel({ returnPath }: { returnPath: WalletReturnPath }) {
  return (
    <article className="panel settings-form" id="wallet">
      <div className="panel-title-row">
        <div>
          <span className="panel-kicker">Apixis Wallet</span>
          <h3>Buy Ixis</h3>
        </div>
        <StatusBadge tone="neutral">Wallet checkout</StatusBadge>
      </div>
      <p className="muted-note">Ixis is purchased in Apixis Wallet. Card charges and the cash credit happen there. Recovra only redeems Ixis against a plan.</p>
      <BuyIxisLink returnPath={returnPath} className="primary-button" icon />
      <p className="muted-note">Your Apixis Wallet (shared by every Apixis site): <ApixisWalletChip /></p>
    </article>
  );
}
