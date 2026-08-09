import { createClient } from "@/lib/supabase/server";
import { updateTheme } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function ThemePage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("site_settings").select("accent_color, dark_color, banner_color").single();

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Design</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Changes apply site-wide immediately.
      </p>

      <form action={updateTheme} className="max-w-sm space-y-5">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Accent color (buttons, links, badges)</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="accent_color"
              defaultValue={settings?.accent_color ?? "#c8102e"}
              className="h-10 w-14 cursor-pointer border border-neutral-300"
            />
            <span className="text-sm text-neutral-500">{settings?.accent_color ?? "#c8102e"}</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Dark color (header text, dark sections)</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="dark_color"
              defaultValue={settings?.dark_color ?? "#111111"}
              className="h-10 w-14 cursor-pointer border border-neutral-300"
            />
            <span className="text-sm text-neutral-500">{settings?.dark_color ?? "#111111"}</span>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Banner color (announcement bar at the very top)</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              name="banner_color"
              defaultValue={settings?.banner_color ?? "#111111"}
              className="h-10 w-14 cursor-pointer border border-neutral-300"
            />
            <span className="text-sm text-neutral-500">{settings?.banner_color ?? "#111111"}</span>
          </div>
        </div>

        <p className="text-xs text-neutral-500">
          Looking for fonts? That moved to its own <span className="font-medium">Font</span> page in the sidebar.
        </p>

        <SubmitButton className="bg-brand-black px-6 py-2.5 text-sm uppercase tracking-wide text-white hover:opacity-90">
          Save
        </SubmitButton>
      </form>
    </div>
  );
}
