import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/locale-server";
import { isRtl } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/settings";
import { SITE_URL } from "@/lib/site";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

const DESCRIPTION = "Lunettes et montures sélectionnées par House of Optics.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "House of Optics", template: "%s | House of Optics" },
  description: DESCRIPTION,
  openGraph: {
    title: "House of Optics",
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "House of Optics",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "House of Optics",
    description: DESCRIPTION,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [locale, settings] = await Promise.all([getLocale(), getSiteSettings()]);

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <style>{`:root{--color-accent:${settings.accent_color};--color-dark:${settings.dark_color};}`}</style>
      </head>
      <body className="min-h-screen bg-white font-sans text-brand-black antialiased">{children}</body>
    </html>
  );
}
