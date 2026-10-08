import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "South Haven Thriller Flash Mob",
  description: "Join the South Haven community Thriller Flash Mob on October 30. No dance experience needed.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
