import type { Metadata, Viewport } from "next";
import { Baloo_2, Inter } from "next/font/google";
import { colors } from "@/lib/brand/tokens";
import "./globals.css";

// next/font self-hosts the files at build time: no request to Google from the visitor's browser.
const baloo = Baloo_2({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-baloo" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Picomètre", template: "%s · Picomètre" },
  description: "On s'amuse, la jauge veille. Réservé aux 18 ans et plus.",
  applicationName: "Picomètre",
  appleWebApp: { capable: true, title: "Picomètre", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: colors.nuit,
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${baloo.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
