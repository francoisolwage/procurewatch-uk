import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProcureWatch UK — Public Procurement Accountability",
  description:
    "UK government procurement accountability dashboard. Scrutinise spending, detect red flags, and track legal services contracts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}