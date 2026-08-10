import { createServiceClient } from "@/lib/supabase/server";
import { ClientDeleteButton } from "./ClientDeleteButton";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const search = (q ?? "").trim().toLowerCase();

  const supabase = createServiceClient();
  const [{ data: orders }, { data: spinWins }] = await Promise.all([
    supabase
      .from("orders")
      .select("customer_name, customer_email, customer_phone, created_at")
      .order("created_at", { ascending: false }),
    // spin_wheel_wins comes from a migration that may not have run yet —
    // a missing table just yields null data here, handled by `?? []` below.
    supabase.from("spin_wheel_wins").select("email").order("created_at", { ascending: false }),
  ]);

  // No separate customers table — a "client" is every distinct email seen
  // across orders, plus every email captured by the spin wheel (even if
  // they never ordered). Keep the most recent name/phone for that email in
  // case they changed between orders.
  const byEmail = new Map<
    string,
    { name: string; phone: string; email: string; orderCount: number; spinCount: number }
  >();
  for (const o of orders ?? []) {
    const existing = byEmail.get(o.customer_email);
    if (existing) {
      existing.orderCount += 1;
    } else {
      byEmail.set(o.customer_email, {
        name: o.customer_name,
        phone: o.customer_phone,
        email: o.customer_email,
        orderCount: 1,
        spinCount: 0,
      });
    }
  }
  for (const w of spinWins ?? []) {
    const existing = byEmail.get(w.email);
    if (existing) {
      existing.spinCount += 1;
    } else {
      byEmail.set(w.email, { name: "", phone: "", email: w.email, orderCount: 0, spinCount: 1 });
    }
  }

  let clients = Array.from(byEmail.values());
  if (search)
    clients = clients.filter(
      (c) => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search)
    );

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">Clients</h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        Everyone who has placed an order, with their name, phone and email.
      </p>

      <form className="mb-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name..."
          className="w-full max-w-xs border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </form>

      {clients.length === 0 && <p className="text-sm text-neutral-500">No clients found.</p>}

      <div className="max-w-2xl space-y-2">
        {clients.map((c) => (
          <div
            key={c.email}
            className="flex items-center justify-between rounded-md border border-neutral-200 bg-white p-4"
          >
            <div>
              <p className="text-sm font-medium">{c.name || "(no order yet — spin wheel only)"}</p>
              <p className="text-xs text-neutral-500">
                {c.phone ? `${c.phone} · ` : ""}
                {c.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {c.spinCount > 0 && (
                <span className="text-xs text-neutral-400">
                  {c.spinCount} spin{c.spinCount === 1 ? "" : "s"}
                </span>
              )}
              <span className="text-xs text-neutral-400">
                {c.orderCount} order{c.orderCount === 1 ? "" : "s"}
              </span>
              <ClientDeleteButton email={c.email} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
