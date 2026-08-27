import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getServerDict } from "@/lib/locale-server";
import { signOutCustomer } from "./actions";
import { OrdersList } from "./OrdersList";
import { ProfileEditForm } from "./ProfileEditForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Defense in depth — middleware already gates /compte, this just avoids
  // ever rendering the dashboard for a signed-out request that somehow
  // reaches here.
  if (!user) redirect("/compte/connexion?next=%2Fcompte");

  const { t } = await getServerDict();
  const service = createServiceClient();

  const [{ data: profile }, { data: orders }, { data: giftCards }] = await Promise.all([
    service.from("customer_profiles").select("name, phone").eq("id", user.id).maybeSingle(),
    service
      .from("orders")
      .select("id, total, status, created_at, items:order_items(product_name, variant_label, quantity, unit_price)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
    service
      .from("gift_cards")
      .select("code, type, discount_percent, credit_amount, remaining_amount, redeemed_at, created_at, product:products(name)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const name = profile?.name ?? (user.user_metadata?.name as string | undefined) ?? user.email ?? "";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl text-brand-black">{t["account.dashboard.title"]}</h1>
          <p className="mt-1 text-sm text-neutral-600">{t["account.dashboard.welcome"].replace("{name}", name)}</p>
          <p className="text-xs text-neutral-400">
            {user.email}
            {profile?.phone ? ` · ${profile.phone}` : ""}
          </p>
          <div className="mt-2">
            <ProfileEditForm name={name} phone={profile?.phone ?? null} />
          </div>
        </div>
        <form action={signOutCustomer}>
          <button
            type="submit"
            className="border border-brand-black px-4 py-2 text-xs uppercase tracking-wide text-brand-black hover:bg-brand-black hover:text-white"
          >
            {t["account.dashboard.logout"]}
          </button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-xl text-brand-black">{t["account.dashboard.ordersTitle"]}</h2>
        <OrdersList orders={(orders as any[]) ?? []} t={t} />
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-serif text-xl text-brand-black">{t["account.dashboard.giftCardsTitle"]}</h2>
        {!giftCards || giftCards.length === 0 ? (
          <p className="text-sm text-neutral-500">{t["account.dashboard.giftCardsEmpty"]}</p>
        ) : (
          <div className="space-y-2">
            {(giftCards as any[]).map((c) => {
              const productName = Array.isArray(c.product) ? c.product[0]?.name : c.product?.name;
              const summary =
                c.type === "product"
                  ? `${productName ?? "Free item"} — FREE`
                  : c.type === "discount"
                    ? `${c.discount_percent}% off`
                    : c.type === "credit" && c.remaining_amount != null && Number(c.remaining_amount) < Number(c.credit_amount)
                      ? `$${Number(c.remaining_amount).toFixed(2)} left of $${Number(c.credit_amount).toFixed(2)}`
                      : `$${Number(c.credit_amount).toFixed(2)} credit`;
              return (
                <div key={c.code} className="flex items-center justify-between rounded-md border border-neutral-200 p-3 text-sm">
                  <span className="font-mono text-xs text-neutral-500">{c.code}</span>
                  <span className="text-brand-black">{summary}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
