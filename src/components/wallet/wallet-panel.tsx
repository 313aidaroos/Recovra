import type { WalletReturnPath } from "@/lib/wallet/embed";
import { StatusBadge } from "../ui/status-badge";
import { BuyIxisLink } from "./buy-ixis-link";

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
      <p className="muted-note">Balance stays on Apixis Wallet until a signed-in Wallet session can be read here. Recovra does not invent a balance.</p>
    </article>
  );
}
