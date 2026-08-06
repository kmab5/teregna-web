import type { Metadata, Viewport } from "next";
import { Outfit, Work_Sans, JetBrains_Mono, Noto_Sans_Ethiopic } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

/**
 * Paired on a contrast axis: a geometric display face against a humanist
 * workhorse, with a mono for anything the eye needs to compare down a column.
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});
const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
const ethiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  variable: "--font-ethiopic",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Teregna — know your turn",
  description:
    "Find a provider, join their queue, and watch your place move in real time.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF7FF" },
    { media: "(prefers-color-scheme: dark)", color: "#141024" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${outfit.variable} ${workSans.variable} ${jetbrains.variable} ${ethiopic.variable}`}
    >
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary"
        >
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
