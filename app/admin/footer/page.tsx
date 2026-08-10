import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { updateFooterSocials } from "./actions";
import { FooterSectionsManager } from "./FooterSectionsManager";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminFooterPage() {
  const supabase = createServiceClient();

  const [{ data: settings }, { data: sectionsRaw }] = await Promise.all([
    // select("*") — youtube_url/tiktok_url/pinterest_url/footer_copyright_text
    // come from a migration that may not have run yet.
    supabase.from("site_settings").select("*").single(),
    supabase
      .from("footer_sections")
      .select("id, title, links:footer_links(id, label, url, sort_order)")
      .order("sort_order", { ascending: true }),
  ]);

  const sections = (sectionsRaw ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    links: (s.links ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }));

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">End of page</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Everything shown at the very bottom of the site, on every page: social links, the link sections (e.g.
        "Customer Area", "Help & Support"), and the copyright line.
      </p>

      <div className="mb-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium">Social links &amp; copyright</p>
        <p className="mb-3 text-xs text-neutral-500">
          Facebook and Instagram are set on the{" "}
          <Link href="/admin/reglages" className="underline hover:text-brand-black">
            Settings
          </Link>{" "}
          page — everything else that appears at the bottom of the site is here.
        </p>
        <form action={updateFooterSocials} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-neutral-500">YouTube URL</label>
            <input
              name="youtube_url"
              defaultValue={settings?.youtube_url ?? ""}
              placeholder="https://youtube.com/@..."
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">TikTok URL</label>
            <input
              name="tiktok_url"
              defaultValue={settings?.tiktok_url ?? ""}
              placeholder="https://tiktok.com/@..."
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Pinterest URL</label>
            <input
              name="pinterest_url"
              defaultValue={settings?.pinterest_url ?? ""}
              placeholder="https://pinterest.com/..."
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-neutral-500">Copyright line</label>
            <input
              name="footer_copyright_text"
              defaultValue={settings?.footer_copyright_text ?? ""}
              placeholder={`© ${new Date().getFullYear()} House of Optics. All rights reserved.`}
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
            Save
          </SubmitButton>
        </form>
      </div>

      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-medium">Link sections</p>
        <FooterSectionsManager sections={sections} />
      </div>
    </div>
  );
}
