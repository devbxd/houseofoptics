import { createClient } from "@/lib/supabase/server";
import { updateSpecialRequestSettings } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SpecialRequestSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("site_settings").select("*").single();

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Special Request</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        The page where a customer describes a frame they want that isn't on the site (with an optional photo) and
        sends it straight to your WhatsApp — reachable from the site menu as "{settings?.special_request_title || "Vous ne trouvez pas votre modèle ?"}
        ". It uses the same WhatsApp number set on the Settings page.
      </p>

      <form action={updateSpecialRequestSettings} className="max-w-lg space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Title</label>
          <input
            name="special_request_title"
            defaultValue={settings?.special_request_title ?? ""}
            placeholder="Vous ne trouvez pas votre modèle ?"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Explanation (French)</label>
          <textarea
            name="special_request_text"
            rows={4}
            defaultValue={settings?.special_request_text ?? ""}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Explanation (English)</label>
          <textarea
            name="special_request_text_en"
            rows={4}
            defaultValue={settings?.special_request_text_en ?? ""}
            placeholder="Leave blank to reuse the French text"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Explanation (Arabic)</label>
          <textarea
            name="special_request_text_ar"
            rows={4}
            dir="rtl"
            defaultValue={settings?.special_request_text_ar ?? ""}
            placeholder="اتركه فارغاً لاستخدام النص الفرنسي"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <SubmitButton className="bg-brand-black px-6 py-2.5 text-sm uppercase tracking-wide text-white hover:opacity-90">
          Save
        </SubmitButton>
      </form>
    </div>
  );
}
