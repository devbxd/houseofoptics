import { createServiceClient } from "@/lib/supabase/server";
import { BroadcastForm } from "./BroadcastForm";

export default async function SubscribersPage() {
  const supabase = createServiceClient();
  const { data: subscribers, count } = await supabase
    .from("newsletter_subscribers")
    .select("email, created_at", { count: "exact" })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-2 font-serif text-2xl">
        Newsletter subscribers <span className="text-lg font-normal text-neutral-400">({count ?? 0})</span>
      </h1>
      <p className="mb-6 max-w-lg text-sm text-neutral-500">
        People who signed up in the "Stay in touch" section on the homepage. Send them an email when
        you add a new discount or launch something new.
      </p>

      <div className="mb-8">
        <BroadcastForm subscriberCount={count ?? 0} />
      </div>

      <div className="max-w-md divide-y divide-neutral-200 border-y border-neutral-200">
        {(subscribers ?? []).map((s) => (
          <div key={s.email} className="flex items-center justify-between py-2 text-sm">
            <span>{s.email}</span>
            <span className="text-xs text-neutral-400">{new Date(s.created_at).toLocaleDateString()}</span>
          </div>
        ))}
        {(!subscribers || subscribers.length === 0) && (
          <p className="py-4 text-sm text-neutral-500">No subscribers yet.</p>
        )}
      </div>
    </div>
  );
}
