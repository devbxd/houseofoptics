import { createClient } from "@/lib/supabase/server";
import { createCategory } from "./actions";
import { CategoryRow } from "./CategoryRow";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug")
    .order("sort_order", { ascending: true });

  // One lightweight head-count per category instead of pulling every
  // product row just to count them client-side.
  const counts = new Map<string, number>();
  await Promise.all(
    (categories ?? []).map(async (c) => {
      const { count } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", c.id);
      counts.set(c.id, count ?? 0);
    })
  );

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">Categories</h1>

      <form action={createCategory} className="mb-8 flex max-w-md gap-2">
        <input
          name="name"
          required
          placeholder="New category (e.g. Aviator, Round...)"
          className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
        <SubmitButton className="bg-brand-black px-5 py-2 text-sm uppercase tracking-wide text-white hover:opacity-90">
          Add
        </SubmitButton>
      </form>

      <div className="max-w-2xl border-t border-neutral-100">
        {(categories ?? []).map((c) => (
          <CategoryRow key={c.id} category={c} productCount={counts.get(c.id) ?? 0} />
        ))}
      </div>
    </div>
  );
}
