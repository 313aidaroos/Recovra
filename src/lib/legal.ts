/**
 * Company details used by the Terms of Service and Privacy Policy pages.
 *
 * Fill these in before publishing to customers. Values can be overridden with environment
 * variables so production can differ from preview without a code change. Nothing here is secret.
 */
export const legalConfig = {
  productName: "Recovra",
  /** Registered legal entity that contracts with customers, e.g. "Recovra Technologies Inc." */
  legalEntity: process.env.NEXT_PUBLIC_LEGAL_ENTITY || "Recovra",
  /** Governing law and venue, e.g. "the State of Delaware, United States". */
  governingLaw: process.env.NEXT_PUBLIC_GOVERNING_LAW || "the jurisdiction in which the operating company is organized",
  /** Where legal and privacy requests should go. */
  contactEmail: process.env.NEXT_PUBLIC_LEGAL_EMAIL || "alaidaroosawad@gmail.com",
  /** Postal address for notices; leave empty to omit. */
  postalAddress: process.env.NEXT_PUBLIC_LEGAL_ADDRESS || "",
  /** Date shown as "Last updated" on both documents. */
  lastUpdated: "2026-09-13",
  /** Where customer data is stored. Update if the Supabase region or hosting provider changes. */
  hosting: { database: "Supabase (AWS us-east-1, United States)", application: "Vercel (United States)" },
};
