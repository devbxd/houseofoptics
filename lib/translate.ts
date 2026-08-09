// Free, no-key machine translation so the client can type dashboard text in
// whichever language is easiest for them and have it show up correctly for
// every visitor regardless of the site's active locale. Auto-detects the
// source language. Best-effort: on any failure, callers should fall back to
// the original text rather than blocking the save.
export async function translateText(text: string, target: "fr" | "en" | "ar"): Promise<string | null> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const chunks = Array.isArray(data?.[0]) ? data[0] : [];
    const translated = chunks.map((chunk: any) => chunk?.[0] ?? "").join("");
    return translated || null;
  } catch {
    return null;
  }
}

// Translates one string into all three site locales in parallel. Any locale
// that fails to translate falls back to the original input rather than
// being left empty.
export async function translateToAllLocales(text: string): Promise<{ fr: string; en: string; ar: string }> {
  const [fr, en, ar] = await Promise.all([
    translateText(text, "fr"),
    translateText(text, "en"),
    translateText(text, "ar"),
  ]);
  return { fr: fr ?? text, en: en ?? text, ar: ar ?? text };
}
