import { createClient } from "@/lib/supabase/server";
import { createCategory } from "./actions";
import { CategoryRow } from "./CategoryRow";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .order("sort_order", { ascending: true });

  const all = categories ?? [];
  const topLevel = all.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => all.filter((c) => c.parent_id === id);

  // One lightweight head-count per category instead of pulling every
  // product row just to count them client-side.
  const counts = new Map<string, number>();
  await Promise.all(
    all.map(async (c) => {
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

      <form action={createCategory} className="mb-8 max-w-md space-y-2">
        <input
          name="name"
          required
          placeholder="New category (e.g. Aviator, Round...)"
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            name="parent_id"
            defaultValue=""
            className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          >
            <option value="">No parent (top-level category)</option>
            {topLevel.map((c) => (
              <option key={c.id} value={c.id}>
                Sub-category of: {c.name}
              </option>
            ))}
          </select>
          <SubmitButton className="shrink-0 bg-brand-black px-5 py-2 text-sm uppercase tracking-wide text-white hover:opacity-90">
            Add
          </SubmitButton>
        </div>
      </form>

      <div className="max-w-2xl border-t border-neutral-100">
        {topLevel.map((c) => (
          <div key={c.id}>
            <CategoryRow category={c} productCount={counts.get(c.id) ?? 0} />
            {childrenOf(c.id).map((sub) => (
              <div key={sub.id} className="pl-6">
                <CategoryRow category={sub} productCount={counts.get(sub.id) ?? 0} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
