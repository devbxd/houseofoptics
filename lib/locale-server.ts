import { cookies } from "next/headers";
import { type Locale, LOCALES, getDictionary } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("locale")?.value;
  return (LOCALES as string[]).includes(value ?? "") ? (value as Locale) : "en";
}

export async function getServerDict() {
  const locale = await getLocale();
  return { locale, t: getDictionary(locale) };
}
