import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { Pagination } from "@/components/Pagination";
import { HeroImageToggle } from "./HeroImageToggle";
import { uploadHeroSlide, updateHeroTitle } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import { HeroSlidesGrid } from "./HeroSlidesGrid";
import { CurrentHeroGrid } from "./CurrentHeroGrid";

const PAGE_SIZE = 24;

export default async function AdminHeroPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const search = (q ?? "").trim();

  const supabase = createServiceClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: current } = await supabase
    .from("product_images")
    .select("id, url, hero_order, products(name)")
    .eq("is_hero", true)
    .order("hero_order", { ascending: true });

  const { data: customSlides } = await supabase
    .from("hero_slides")
    .select("id, image_url")
    .order("sort_order", { ascending: true });

  // select("*") rather than naming the column — hero_title_fr comes from a
  // migration that may not have run yet, and "*" degrades gracefully.
  const { data: settings } = await supabase.from("site_settings").select("*").single();

  let query = supabase
    .from("products")
    .select("id, name, images:product_images(id, url, sort_order, is_hero)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) query = query.ilike("name", `%${search}%`);

  const { data: products, count } = await query;
  const basePath = search ? `/admin/hero?q=${encodeURIComponent(search)}` : "/admin/hero";

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Homepage carousel</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Pick which photos scroll on the homepage, or upload any image you want (not tied to a product). If
        nothing is selected, the site automatically shows the sharpest recent product photos instead.
      </p>

      <div className="mb-8 max-w-lg rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium">Big homepage title</p>
        <p className="mb-3 text-xs text-neutral-500">
          Type it in any language you want — it's automatically translated so every visitor sees it in French,
          English or Arabic depending on the site's language. Leave empty to use the default title.
        </p>
        <form action={updateHeroTitle} className="flex items-center gap-3">
          <input
            name="hero_title"
            defaultValue={settings?.hero_title_fr ?? ""}
            placeholder="e.g. L'art de voir autrement."
            className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
          <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
            Save
          </SubmitButton>
        </form>
      </div>

      <div className="mb-8 rounded-md border border-neutral-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium">Custom uploaded images ({(customSlides ?? []).length})</p>
        <HeroSlidesGrid slides={customSlides ?? []} />
        <form action={uploadHeroSlide} encType="multipart/form-data" className="mt-3 flex items-center gap-3">
          <input name="image" type="file" accept="image/*" required className="text-sm" />
          <SubmitButton className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white">
            Upload
          </SubmitButton>
        </form>
      </div>

      {current && current.length > 0 && (
        <div className="mb-8 rounded-md border border-neutral-200 bg-white p-4">
          <p className="mb-3 text-sm font-medium">Currently in the carousel ({current.length})</p>
          <CurrentHeroGrid images={current.map((img: any) => ({ id: img.id, url: img.url }))} />
        </div>
      )}

      <form className="mb-6">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by name..."
          className="w-full max-w-xs border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </form>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {(products ?? []).map((p: any) => {
          const img = (p.images ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order)[0];
          if (!img) return null;
          return (
            <div key={p.id} className="rounded-md border border-neutral-200 bg-white p-2">
              <div className="relative mb-2 aspect-square overflow-hidden rounded bg-neutral-100">
                <Image src={img.url} alt={p.name} fill sizes="200px" className="object-cover" />
              </div>
              <p className="mb-2 truncate text-xs text-neutral-600">{p.name}</p>
              <HeroImageToggle imageId={img.id} initialIsHero={!!img.is_hero} />
            </div>
          );
        })}
      </div>

      <Pagination page={page} total={count ?? 0} pageSize={PAGE_SIZE} basePath={basePath} />
    </div>
  );
}
