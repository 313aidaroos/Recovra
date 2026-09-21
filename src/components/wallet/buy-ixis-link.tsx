import { Wallet } from "lucide-react";
import { apixisWalletBuyUrl, type WalletReturnPath } from "@/lib/wallet/embed";

export function BuyIxisLink({
  returnPath,
  label = "Buy Ixis",
  className,
  icon = false,
}: {
  returnPath: WalletReturnPath;
  label?: string;
  className?: string;
  icon?: boolean;
}) {
  return (
    <a className={className} href={apixisWalletBuyUrl(returnPath)}>
      {icon ? <Wallet size={15} aria-hidden="true" /> : null}
      {label}
    </a>
  );
}
