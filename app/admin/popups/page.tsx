import { createServiceClient } from "@/lib/supabase/server";
import { createPopup } from "./actions";
import { PopupRow } from "./PopupRow";
import { SubmitButton } from "@/components/SubmitButton";

export default async function PopupsPage() {
  const supabase = createServiceClient();
  const { data: popups } = await supabase.from("popups").select("*").order("created_at", { ascending: false });

  const rows = await Promise.all(
    (popups ?? []).map(async (p) => {
      let usesCount: number | null = null;
      if (p.max_uses != null) {
        const { count } = await supabase
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", p.created_at);
        usesCount = count ?? 0;
      }
      return { ...p, usesCount };
    })
  );

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Pop-ups</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Show an announcement pop-up on the homepage — a promo, a message, whatever you want. Optionally set an
        order limit and/or a number of days after which it stops showing automatically.
      </p>

      <form
        action={createPopup}
        encType="multipart/form-data"
        className="mb-8 max-w-md space-y-3 rounded-md border border-neutral-200 bg-white p-4"
      >
        <p className="text-sm font-medium">New pop-up</p>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Title</label>
          <input
            name="title"
            required
            placeholder="e.g. Welcome offer"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Image (optional — shown above the description)</label>
          <input name="image" type="file" accept="image/*" className="w-full text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-neutral-600">Description</label>
          <textarea
            name="description"
            rows={3}
            placeholder="e.g. Get 20% off your first order!"
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Discount %</label>
            <input
              name="discount_percent"
              type="number"
              min={0}
              max={95}
              placeholder="20"
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Stop after N orders</label>
            <input
              name="max_uses"
              type="number"
              min={1}
              placeholder="20"
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Stop after N days</label>
            <input
              name="duration_days"
              type="number"
              min={1}
              placeholder="7"
              className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
        </div>
        <SubmitButton className="bg-brand-black px-6 py-2.5 text-sm uppercase tracking-wide text-white hover:opacity-90">
          Create
        </SubmitButton>
      </form>

      <div className="max-w-md space-y-3">
        {rows.map((p) => (
          <PopupRow key={p.id} popup={p} />
        ))}
        {rows.length === 0 && <p className="text-sm text-neutral-500">No pop-ups yet.</p>}
      </div>
    </div>
  );
}
