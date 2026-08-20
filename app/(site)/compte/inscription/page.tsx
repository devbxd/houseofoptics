import Link from "next/link";
import { getServerDict } from "@/lib/locale-server";
import { signUpCustomer } from "../actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string; pending?: string }>;
}) {
  const { error, next, pending } = await searchParams;
  const { t } = await getServerDict();
  const safeNext = next && next.startsWith("/") ? next : "/compte";

  if (pending) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="rounded-2xl border border-brand-black/10 bg-brand-beige p-8 text-center shadow-xl">
          <p className="text-[11px] uppercase tracking-[0.35em] text-brand-red">House of Optics</p>
          <h1 className="mt-2 font-serif text-2xl text-brand-black">{t["account.signup.pendingTitle"]}</h1>
          <p className="mt-3 text-sm text-neutral-600">{t["account.signup.pendingText"]}</p>
          <Link
            href={`/compte/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="mt-6 inline-block border border-brand-black px-6 py-2.5 text-xs uppercase tracking-widest text-brand-black hover:bg-brand-black hover:text-white"
          >
            {t["account.signup.loginLink"]}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-brand-black/10 bg-brand-beige p-8 shadow-xl">
        <p className="text-center text-[11px] uppercase tracking-[0.35em] text-brand-red">House of Optics</p>
        <h1 className="mt-2 text-center font-serif text-2xl text-brand-black">{t["account.signup.title"]}</h1>
        <p className="mt-2 text-center text-sm text-neutral-600">{t["account.signup.subtitle"]}</p>

        {error && <p className="mt-4 text-center text-sm text-brand-red">{error}</p>}

        <form action={signUpCustomer} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={safeNext} />
          <div>
            <label className="mb-1 block text-sm text-neutral-600">{t["account.signup.name"]}</label>
            <input
              required
              type="text"
              name="name"
              className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">{t["account.signup.email"]}</label>
            <input
              required
              type="email"
              name="email"
              className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">{t["account.signup.phone"]}</label>
            <input
              type="tel"
              name="phone"
              className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">{t["account.signup.password"]}</label>
            <input
              required
              minLength={6}
              type="password"
              name="password"
              className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white hover:opacity-90"
          >
            {t["account.signup.submit"]}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t["account.signup.haveAccount"]}{" "}
          <Link
            href={`/compte/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-brand-black underline underline-offset-2"
          >
            {t["account.signup.loginLink"]}
          </Link>
        </p>
      </div>
    </main>
  );
}
