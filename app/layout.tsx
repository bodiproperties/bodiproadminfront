import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bodi Properties — Studio Admin",
  description: "Manage projects, news and home page images",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
