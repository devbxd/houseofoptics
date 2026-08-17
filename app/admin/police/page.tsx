import { getSiteSettings } from "@/lib/settings";
import { updateFonts } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { HEADING_FONTS, BODY_FONTS, DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT, DEFAULT_ACCENT_FONT } from "@/lib/fonts";

// Never statically cached — this page must always reflect what's actually
// in the database, especially right after a save.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FontPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { saved, error } = await searchParams;
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Font</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Three separate fonts control the entire site. Changing one only affects the parts it's responsible for —
        pick the combination that looks best together. Changes apply everywhere immediately after saving, no
        rebuild needed.
      </p>

      {saved && !error && (
        <p className="mb-6 max-w-sm rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Saved — the values below are freshly reloaded from the database.
        </p>
      )}
      {error && (
        <p className="mb-6 max-w-sm rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          Save failed: {error}
        </p>
      )}

      <form action={updateFonts} className="max-w-sm space-y-6">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Heading font</label>
          <p className="mb-1.5 text-xs text-neutral-400">
            Every title: the big homepage banner, section titles ("Nos marques", "Catégories"...), product names,
            brand names.
          </p>
          <select
            key={settings.heading_font}
            name="heading_font"
            defaultValue={settings.heading_font ?? DEFAULT_HEADING_FONT}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            style={{ fontFamily: `'${settings.heading_font ?? DEFAULT_HEADING_FONT}', serif` }}
          >
            {Object.keys(HEADING_FONTS).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Body font</label>
          <p className="mb-1.5 text-xs text-neutral-400">
            Regular text: descriptions, paragraphs, addresses — anywhere the reader is reading a sentence rather
            than glancing at a label.
          </p>
          <select
            key={settings.body_font}
            name="body_font"
            defaultValue={settings.body_font ?? DEFAULT_BODY_FONT}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            style={{ fontFamily: `'${settings.body_font ?? DEFAULT_BODY_FONT}', sans-serif` }}
          >
            {Object.keys(BODY_FONTS).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Accent font</label>
          <p className="mb-1.5 text-xs text-neutral-400">
            Every button and small uppercase label: Add to cart, Buy now, Shop now, the menu, the footer links,
            "In stock", discount badges, the checkout button — anything written in capital letters anywhere on
            the site.
          </p>
          <select
            key={settings.accent_font}
            name="accent_font"
            defaultValue={settings.accent_font ?? DEFAULT_ACCENT_FONT}
            className="w-full border border-neutral-300 px-3 py-2 text-sm uppercase tracking-wide focus:border-brand-black focus:outline-none"
            style={{ fontFamily: `'${settings.accent_font ?? DEFAULT_ACCENT_FONT}', sans-serif` }}
          >
            {Object.keys(BODY_FONTS).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <SubmitButton className="bg-brand-black px-6 py-2.5 text-sm uppercase tracking-wide text-white hover:opacity-90">
          Save
        </SubmitButton>
      </form>
    </div>
  );
}
