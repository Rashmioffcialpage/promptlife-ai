import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PromptLife AI — Guided prompts for student life",
  description: "Turn real student situations into personalized, responsible prompt journeys.",
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
