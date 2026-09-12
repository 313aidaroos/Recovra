import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Recovra — Recovery Intelligence",
  description: "Find overcharges. Recover savings. Control spend.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
