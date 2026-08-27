import Link from "next/link";
import { getServerDict } from "@/lib/locale-server";
import { signInCustomer } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  const { t } = await getServerDict();
  const safeNext = next && next.startsWith("/") ? next : "/compte";

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-brand-black/10 bg-brand-beige p-8 shadow-xl">
        <p className="text-center text-[11px] uppercase tracking-[0.35em] text-brand-red">House of Optics</p>
        <h1 className="mt-2 text-center font-serif text-2xl text-brand-black">{t["account.login.title"]}</h1>
        <p className="mt-2 text-center text-sm text-neutral-600">{t["account.login.subtitle"]}</p>

        {next && next !== "/compte" && (
          <p className="mt-4 rounded border border-brand-black/10 bg-white/60 px-3 py-2 text-center text-xs text-neutral-600">
            {t["account.login.requiredNotice"]}
          </p>
        )}

        {error && <p className="mt-4 text-center text-sm text-brand-red">{error}</p>}

        <form action={signInCustomer} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={safeNext} />
          <div>
            <label className="mb-1 block text-sm text-neutral-600">{t["account.login.email"]}</label>
            <input
              required
              type="email"
              name="email"
              className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-neutral-600">{t["account.login.password"]}</label>
            <input
              required
              type="password"
              name="password"
              className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white hover:opacity-90"
          >
            {t["account.login.submit"]}
          </button>
        </form>

        <p className="mt-3 text-center text-sm">
          <Link href="/compte/mot-de-passe-oublie" className="text-neutral-600 underline underline-offset-2 hover:text-brand-black">
            Mot de passe oublié ?
          </Link>
        </p>

        <p className="mt-6 text-center text-sm text-neutral-600">
          {t["account.login.noAccount"]}{" "}
          <Link
            href={`/compte/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-medium text-brand-black underline underline-offset-2"
          >
            {t["account.login.createLink"]}
          </Link>
        </p>
      </div>
    </main>
  );
}
