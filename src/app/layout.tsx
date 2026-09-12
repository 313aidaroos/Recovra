import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Recovra — Recovery Intelligence",
    template: "%s | Recovra",
  },
  description: "Find overcharges. Recover savings. Control spend.",
  applicationName: "Recovra",
  keywords: ["recovery intelligence", "invoice audit", "contract compliance", "spend optimization"],
  openGraph: {
    type: "website",
    title: "Recovra — Recovery Intelligence",
    description: "Find overcharges. Recover savings. Control spend.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
