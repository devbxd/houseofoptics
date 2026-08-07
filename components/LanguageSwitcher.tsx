"use client";

import { LOCALES, type Locale } from "@/lib/i18n";
import { useLocale } from "@/lib/locale-client";

const LABELS: Record<Locale, string> = { fr: "FR", en: "EN", ar: "AR" };

export function LanguageSwitcher() {
  const { locale } = useLocale();

  function switchTo(next: Locale) {
    document.cookie = `locale=${next}; path=/; max-age=31536000`;
    // Full reload guarantees every server component (header, layout, dir/lang
    // attributes) re-renders with the new locale — router.refresh() alone
    // left some parent layout output stale.
    window.location.reload();
  }

  return (
    <div className="flex items-center gap-0.5 text-[11px] md:gap-1 md:text-xs">
      {LOCALES.map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`px-1 py-0.5 uppercase tracking-wide transition-colors md:px-1.5 ${
            l === locale ? "text-brand-red" : "text-neutral-400 hover:text-brand-black"
          }`}
        >
          {LABELS[l]}
        </button>
      ))}
    </div>
  );
}
