"use client";

import { useEffect, useState } from "react";
import { type Locale, LOCALES, getDictionary } from "./i18n";

function readLocaleCookie(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|; )locale=([^;]*)/);
  const value = match ? decodeURIComponent(match[1]) : "";
  return (LOCALES as string[]).includes(value) ? (value as Locale) : "en";
}

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(readLocaleCookie());
  }, []);

  return { locale, t: getDictionary(locale) };
}
