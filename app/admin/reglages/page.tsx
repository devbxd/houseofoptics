import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { updateSettings } from "./actions";
import { updateGlobalProductInfo, uploadPackagingImage, removePackagingImage } from "../produits/actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("site_settings").select("*").single();

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Settings</h1>

      <div className="mb-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium">Shipping &amp; Returns (all products)</p>
        <p className="mb-3 text-xs text-neutral-500">
          These two apply to every product at once — description and additional information are set per product,
          in each product's own edit page (Admin &gt; Products &gt; Edit).
        </p>
        <form action={updateGlobalProductInfo} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Shipping &amp; delivery</label>
            <textarea
              name="global_shipping_info"
              rows={3}
              defaultValue={settings?.global_shipping_info}
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Return and exchange</label>
            <textarea
              name="returns_info"
              rows={3}
              defaultValue={settings?.returns_info}
              placeholder="Leave empty to use the default returns text"
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
            Save
          </SubmitButton>
        </form>
      </div>

      <div className="mb-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium">Packaging photo (all products)</p>
        <p className="mb-3 text-xs text-neutral-500">
          Shown on every product page after the description, as an "Included With Every Pair" section — e.g. a
          photo of the box, pouch and cleaning cloth.
        </p>
        {settings?.packaging_image_url && (
          <div className="mb-3 flex items-center gap-3">
            <Image
              src={settings.packaging_image_url}
              alt="Packaging"
              width={96}
              height={96}
              className="h-24 w-24 rounded object-cover"
            />
            <form action={removePackagingImage}>
              <SubmitButton className="text-xs text-neutral-400 hover:text-red-600">Remove</SubmitButton>
            </form>
          </div>
        )}
        <form action={uploadPackagingImage} encType="multipart/form-data" className="flex items-center gap-3">
          <input name="image" type="file" accept="image/*" required className="text-sm" />
          <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
            Upload
          </SubmitButton>
        </form>
      </div>

      <form action={updateSettings} encType="multipart/form-data" className="max-w-md space-y-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Logo</label>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded border border-neutral-200 bg-neutral-50">
              <Image src={settings?.logo_url || "/logo-black.png"} alt="" fill sizes="64px" className="object-contain p-1" />
            </div>
            <input name="logo" type="file" accept="image/*" className="text-sm" />
          </div>
          <p className="mt-1 text-xs text-neutral-500">
            Upload a new logo any time (e.g. a holiday version) — it replaces the header logo everywhere.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Brand name</label>
          <input
            name="brand_name"
            defaultValue={settings?.brand_name}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Announcement banner text (top of every page)</label>
          <input
            name="announcement_text"
            defaultValue={settings?.announcement_text ?? "Nouveautés ajoutées chaque semaine"}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
          <p className="mt-1 text-xs text-neutral-500">Banner color is set on the Design page.</p>
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

        <div className="border-t border-neutral-200 pt-4">
          <label className="mb-1 block text-sm text-neutral-600">Shop address (used for the map on the Location page)</label>
          <input
            name="shop_address"
            defaultValue={settings?.shop_address ?? "Smoke N Black, Furn El Chebbak, Liban"}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Location page description (French)</label>
          <textarea
            name="shop_description"
            rows={4}
            defaultValue={settings?.shop_description}
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Location page description (English)</label>
          <textarea
            name="shop_description_en"
            rows={4}
            defaultValue={settings?.shop_description_en}
            placeholder="Leave blank to reuse the French text"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Location page description (Arabic)</label>
          <textarea
            name="shop_description_ar"
            rows={4}
            dir="rtl"
            defaultValue={settings?.shop_description_ar}
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
