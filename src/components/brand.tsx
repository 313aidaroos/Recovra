import Link from "next/link";
import { ScanSearch } from "lucide-react";

export function Brand({ compact=false }: { compact?: boolean }) {
  return <Link href="/" className="brand" aria-label="Recovra home">
    <span className="brand-mark"><ScanSearch size={20}/></span>
    {!compact && <span>Recovra</span>}
  </Link>;
}
