import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { getLocale } from "@/lib/locale-server";
import { isRtl } from "@/lib/i18n";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-serif", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "House of Optics",
  description: "Lunettes et montures sélectionnées par House of Optics.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-white font-sans text-brand-black antialiased">{children}</body>
    </html>
  );
}
