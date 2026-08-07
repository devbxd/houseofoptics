import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("site_settings").select("*").single();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Settings</h1>

      <form action={updateSettings} className="max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Brand name</label>
          <input
            name="brand_name"
            defaultValue={settings?.brand_name}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">WhatsApp number (with country code, e.g. 96181701556)</label>
          <input
            name="whatsapp_number"
            defaultValue={settings?.whatsapp_number}
            placeholder="96181701556"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Contact email</label>
          <input
            name="contact_email"
            type="email"
            defaultValue={settings?.contact_email}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Instagram handle (without @)</label>
          <input
            name="instagram_handle"
            defaultValue={settings?.instagram_handle}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Facebook page URL</label>
          <input
            name="facebook_url"
            defaultValue={settings?.facebook_url}
            placeholder="https://facebook.com/..."
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
