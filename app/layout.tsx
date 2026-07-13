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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem("schedai-theme-v1");
                var session = localStorage.getItem("schedai-session-v2");
                if (!theme && session) theme = JSON.parse(session).isDarkMode ? "dark" : "light";
                document.documentElement.classList.toggle("dark", theme === "dark");
              } catch (_) {}
            `
          }}
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
