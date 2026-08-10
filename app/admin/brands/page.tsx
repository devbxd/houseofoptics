import { createClient } from "@/lib/supabase/server";
import { createBrand } from "./actions";
import { BrandRow } from "./BrandRow";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminBrandsPage() {
  const supabase = await createClient();
  // select("*") rather than naming featured_on_homepage/homepage_banner_url —
  // they come from a migration that may not have run yet, and "*" degrades
  // gracefully instead of erroring on a missing column.
  const { data: brands } = await supabase.from("brands").select("*").order("sort_order", { ascending: true });

  const counts = new Map<string, number>();
  await Promise.all(
    (brands ?? []).map(async (b) => {
      const { count } = await supabase.from("products").select("*", { count: "exact", head: true }).eq("brand_id", b.id);
      counts.set(b.id, count ?? 0);
    })
  );

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Brands</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Ray-Ban, Gucci, Prada... Create brands here, then assign each product to one when editing it.
        Click the logo square next to a brand name to upload its logo — it shows up on the shop and homepage.
        Tick "Featured on homepage" and upload a banner photo to give a brand its own showcase section on the
        homepage (its products underneath are automatic).
      </p>

      <form action={createBrand} className="mb-8 flex max-w-md gap-2">
        <input
          name="name"
          required
          placeholder="New brand (e.g. Ray-Ban, Gucci...)"
          className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
        <SubmitButton className="bg-brand-black px-5 py-2 text-sm uppercase tracking-wide text-white hover:opacity-90">
          Add
        </SubmitButton>
      </form>

      <div className="max-w-2xl border-t border-neutral-100">
        {(brands ?? []).map((b) => (
          <BrandRow key={b.id} brand={b} productCount={counts.get(b.id) ?? 0} />
        ))}
      </div>
    </div>
  );
}
