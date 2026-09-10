import "./globals.css";
import type { Metadata } from "next";
import IdleLogoutProvider from "@/components/admin/IdleLogoutProvider";

export const metadata: Metadata = {
  title: "Bodi Properties — Admin Controller",
  description: "Manage projects, news and home page images",
  icons: {
    icon: "/images/solologo.png",
    shortcut: "/images/solologo.png",
    apple: "/images/solologo.png",
  },
  openGraph: {
    title: "Bodi Properties — Admin Controller",
    description: "Manage projects, news and home page images",
    images: ["/images/solologo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <IdleLogoutProvider>{children}</IdleLogoutProvider>
      </body>
    </html>
  );
}