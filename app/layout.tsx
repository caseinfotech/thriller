import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "South Haven Thriller Flash Mob",
  description: "South Haven Thriller Flash Mob: final practice October 29 at Moose Lodge, 5 PM. October 30 meet-up at First Congregational Church, 6 PM; performance approx. 7:15 PM after the Headless Horseman finishes its route.",
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
