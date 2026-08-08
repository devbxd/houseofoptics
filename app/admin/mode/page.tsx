import { createClient } from "@/lib/supabase/server";
import { ModeButtons } from "./ModeButtons";
import type { SiteMode } from "@/lib/settings";

export default async function AdminModePage() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("active_mode").single();

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Mode</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Activate a seasonal look for the entire public site — decorations, music, and colors change everywhere
        (home, products, cart, checkout). No new pages or products needed, just click a mode. Switch back to
        Normal anytime.
      </p>

      <ModeButtons initialMode={(data?.active_mode as SiteMode) ?? null} />
    </div>
  );
}
