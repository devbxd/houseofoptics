import { createClient } from "@/lib/supabase/server";
import { updateFonts } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { HEADING_FONTS, BODY_FONTS, DEFAULT_HEADING_FONT, DEFAULT_BODY_FONT } from "@/lib/fonts";

export default async function FontPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("site_settings").select("heading_font, body_font").single();

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Font</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Pick the font used for titles/headings and the one used for regular text, anywhere on the site. Changes
        apply site-wide immediately after saving.
      </p>

      <form action={updateFonts} className="max-w-sm space-y-5">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Heading font (titles, product names)</label>
          <select
            name="heading_font"
            defaultValue={settings?.heading_font ?? DEFAULT_HEADING_FONT}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            style={{ fontFamily: `'${settings?.heading_font ?? DEFAULT_HEADING_FONT}', serif` }}
          >
            {Object.keys(HEADING_FONTS).map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Body font (paragraphs, buttons, menus)</label>
          <select
            name="body_font"
            defaultValue={settings?.body_font ?? DEFAULT_BODY_FONT}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            style={{ fontFamily: `'${settings?.body_font ?? DEFAULT_BODY_FONT}', sans-serif` }}
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
