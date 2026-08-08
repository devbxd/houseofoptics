import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "../ProductForm";
import { createProduct } from "../actions";

export default async function NewProductPage() {
  const supabase = await createClient();
  const [{ data: categories }, { data: brands }] = await Promise.all([
    supabase.from("categories").select("id, name, parent_id").order("sort_order"),
    supabase.from("brands").select("id, name").order("sort_order"),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl">New product</h1>
      <ProductForm action={createProduct} categories={categories ?? []} brands={brands ?? []} submitLabel="Create product" />
    </div>
  );
}
