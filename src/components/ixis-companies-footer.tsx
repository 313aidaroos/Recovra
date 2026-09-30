import { otherIxisCompanies } from "@/lib/ixis-companies";

export function IxisCompaniesFooter() {
  return (
    <footer className="ixis-companies">
      <span>Other Ixis companies</span>
      <nav aria-label="Other Ixis companies">
        {otherIxisCompanies.map((company) => (
          <a key={company.url} href={company.url} target="_blank" rel="noopener noreferrer">
            {company.name}
          </a>
        ))}
      </nav>
    </footer>
  );
}
