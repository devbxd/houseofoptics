import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { createTestimonial, deleteTestimonial, toggleTestimonial } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminTestimonialsPage() {
  const supabase = createServiceClient();
  const [{ data: testimonials }, { data: products }] = await Promise.all([
    supabase
      .from("testimonials")
      .select("id, author_name, quote, rating, is_active, photo_url, product_id, product:products(name)")
      .order("sort_order", { ascending: true }),
    supabase.from("products").select("id, name").order("name", { ascending: true }),
  ]);

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Testimonials</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Customers can submit their own review from the "We would love to have your feedback" button on the
        homepage — those land here as pending and won't show on the site until you hit Approve. General reviews
        (no product picked) show as a scrolling carousel on the homepage; reviews linked to a product also show
        on that product's page.
      </p>

      <form action={createTestimonial} className="mb-8 max-w-md space-y-3 rounded-md border border-neutral-200 bg-white p-4">
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Customer name</label>
          <input name="author_name" required className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Review</label>
          <textarea name="quote" rows={3} required className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Rating (1-5, optional)</label>
          <input name="rating" type="number" min={1} max={5} className="w-24 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Product (optional — shows on that product's page too)</label>
          <select name="product_id" defaultValue="" className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none">
            <option value="">General review (homepage only)</option>
            {(products ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Customer photo (optional)</label>
          <input name="photo" type="file" accept="image/*" className="w-full text-sm" />
        </div>
        <SubmitButton className="bg-brand-black px-5 py-2 text-sm uppercase tracking-wide text-white hover:opacity-90">
          Add testimonial
        </SubmitButton>
      </form>

      <div className="space-y-3">
        {(testimonials ?? []).map((r: any) => (
          <div key={r.id} className="flex items-start justify-between gap-4 rounded-md border border-neutral-200 bg-white p-4">
            <div className="flex items-start gap-3">
              {r.photo_url ? (
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-neutral-100">
                  <Image src={r.photo_url} alt="" fill sizes="40px" className="object-cover" />
                </div>
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs text-neutral-400">
                  {r.author_name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {r.author_name} {r.rating && <span className="text-neutral-400">· {"★".repeat(r.rating)}</span>}
                  {!r.is_active && (
                    <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-normal uppercase tracking-wide text-amber-700">
                      Pending approval
                    </span>
                  )}
                </p>
                <p className="mt-1 text-sm text-neutral-600">{r.quote}</p>
                <p className="mt-1 text-xs text-neutral-400">
                  {r.product ? `On product: ${Array.isArray(r.product) ? r.product[0]?.name : r.product.name}` : "General (homepage)"}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-3 text-sm">
              <form action={toggleTestimonial.bind(null, r.id, !r.is_active)}>
                <button className={r.is_active ? "text-neutral-600 hover:text-brand-black" : "font-medium text-emerald-700 hover:underline"}>
                  {r.is_active ? "Hide" : "Approve"}
                </button>
              </form>
              <form action={deleteTestimonial.bind(null, r.id)}>
                <button className="text-neutral-600 hover:text-red-600">Delete</button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
