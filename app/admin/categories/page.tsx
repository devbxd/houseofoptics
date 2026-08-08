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
  const childrenOf = (id: string | null) => all.filter((c) => c.parent_id === id);

  // Flatten the tree (any depth) into an ordered, depth-tagged list so both
  // the parent picker and the nested listing below can just map over it.
  function flatten(parentId: string | null, depth: number): { category: (typeof all)[number]; depth: number }[] {
    return childrenOf(parentId).flatMap((c) => [{ category: c, depth }, ...flatten(c.id, depth + 1)]);
  }
  const flatTree = flatten(null, 0);

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
            {flatTree.map(({ category: c, depth }) => (
              <option key={c.id} value={c.id}>
                {"    ".repeat(depth)}Sub-category of: {c.name}
              </option>
            ))}
          </select>
          <SubmitButton className="shrink-0 bg-brand-black px-5 py-2 text-sm uppercase tracking-wide text-white hover:opacity-90">
            Add
          </SubmitButton>
        </div>
        <p className="text-xs text-neutral-500">
          Pick any existing category as the parent — sub-categories can have their own sub-categories, nested as
          deep as you need.
        </p>
      </form>

      <div className="max-w-2xl border-t border-neutral-100">
        {flatTree.map(({ category: c, depth }) => (
          <div key={c.id} style={{ paddingLeft: `${depth * 1.5}rem` }}>
            <CategoryRow category={c} productCount={counts.get(c.id) ?? 0} />
          </div>
        ))}
      </div>
    </div>
  );
}
