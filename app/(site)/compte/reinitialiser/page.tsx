import { resetPassword } from "../actions";
import { getServerDict } from "@/lib/locale-server";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const { t } = await getServerDict();

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-brand-black/10 bg-brand-beige p-8 shadow-xl">
        <p className="text-center text-[11px] uppercase tracking-[0.35em] text-brand-red">House of Optics</p>
        <h1 className="mt-2 text-center font-serif text-2xl text-brand-black">Nouveau mot de passe</h1>

        {error && <p className="mt-4 text-center text-sm text-brand-red">{t[`account.error.${error}`] ?? error}</p>}

        <form action={resetPassword} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm text-neutral-600">Nouveau mot de passe</label>
            <input
              required
              type="password"
              name="password"
              minLength={6}
              className="w-full border border-neutral-300 bg-white px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white hover:opacity-90"
          >
            Enregistrer
          </button>
        </form>
      </div>
    </main>
  );
}
