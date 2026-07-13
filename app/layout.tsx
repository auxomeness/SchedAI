import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SchedAI",
  description: "Generate a clean weekly class schedule from your university file.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
