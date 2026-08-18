import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("content_pages").select("title").eq("slug", slug).single();
  return { title: data?.title ?? "Page" };
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase.from("content_pages").select("id, title, body").eq("slug", slug).single();

  if (!page) notFound();

  const { data: blocks } = await supabase
    .from("content_page_blocks")
    .select("id, type, text, image_urls")
    .eq("page_id", page.id)
    .order("sort_order", { ascending: true });

  // A freshly-created page (via a new footer link) has a placeholder body
  // ("Content coming soon...") but zero blocks yet — without this fallback
  // it rendered completely blank below the title until an admin opened
  // "Page content" and added something, with no visible sign that's why.
  const hasVisibleBlock = (blocks ?? []).some((b) =>
    b.type === "text" ? !!b.text?.trim() : ((b.image_urls as string[]) ?? []).length > 0
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-2xl">{page.title}</h1>
      <div className="mt-6 space-y-8">
        {!hasVisibleBlock && page.body?.trim() && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{page.body}</p>
        )}
        {(blocks ?? []).map((b) =>
          b.type === "text" ? (
            b.text?.trim() ? (
              <p key={b.id} className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                {b.text}
              </p>
            ) : null
          ) : (
            (b.image_urls as string[]).length > 0 && (
              <div key={b.id} className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4" style={{ scrollbarWidth: "none" }}>
                {(b.image_urls as string[]).map((url) => (
                  <div key={url} className="relative aspect-[4/5] w-56 shrink-0 overflow-hidden rounded-sm bg-neutral-100">
                    <Image src={url} alt="" fill sizes="224px" className="object-cover" />
                  </div>
                ))}
              </div>
            )
          )
        )}
      </div>
    </main>
  );
}
