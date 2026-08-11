import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { updateFooterSocials } from "./actions";
import { FooterSectionsManager } from "./FooterSectionsManager";
import { ContentPagesManager } from "./ContentPagesManager";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminFooterPage() {
  const supabase = createServiceClient();

  const [{ data: settings }, { data: sectionsRaw }, { data: contentPagesRaw }] = await Promise.all([
    // select("*") — youtube_url/tiktok_url/pinterest_url/footer_copyright_text
    // come from a migration that may not have run yet.
    supabase.from("site_settings").select("*").single(),
    supabase
      .from("footer_sections")
      .select("id, title, links:footer_links(id, label, url, sort_order)")
      .order("sort_order", { ascending: true }),
    // content_pages/content_page_blocks come from a migration that may not
    // have run yet — a missing table just yields null data here.
    supabase
      .from("content_pages")
      .select("id, slug, title, blocks:content_page_blocks(id, type, text, image_urls, sort_order)")
      .order("title", { ascending: true }),
  ]);

  const sections = (sectionsRaw ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    links: (s.links ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }));

  const contentPages = (contentPagesRaw ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    blocks: (p.blocks ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order),
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
          The footer shows Facebook, Instagram, WhatsApp and Email — all four are set on the{" "}
          <Link href="/admin/reglages" className="underline hover:text-brand-black">
            Settings
          </Link>{" "}
          page. Only the copyright line is set here.
        </p>
        <form action={updateFooterSocials} className="space-y-3">
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

      <div className="mb-8 max-w-2xl">
        <p className="mb-3 text-sm font-medium">Link sections</p>
        <FooterSectionsManager sections={sections} />
      </div>

      <div className="max-w-2xl">
        <p className="mb-1 text-sm font-medium">Page content</p>
        <p className="mb-3 text-xs text-neutral-500">
          The actual text shown on Terms of Sale, Warranty, FAQ and the other footer pages — click Edit to change
          what a page says, no need to touch the link itself.
        </p>
        <ContentPagesManager pages={contentPages} />
      </div>
    </div>
  );
}
