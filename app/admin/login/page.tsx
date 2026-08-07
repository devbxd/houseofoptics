import { signIn } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <form action={signIn} className="w-full max-w-sm space-y-4 rounded-md border border-neutral-200 bg-white p-8">
        <h1 className="text-center font-serif text-xl">Dashboard House of Optics</h1>

        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Email</label>
          <input
            name="email"
            type="email"
            required
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-neutral-600">Password</label>
          <input
            name="password"
            type="password"
            required
            className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
          />
        </div>

        <SubmitButton className="w-full bg-brand-black py-2.5 text-sm uppercase tracking-wide text-white hover:opacity-90">
          Sign in
        </SubmitButton>
      </form>
    </main>
  );
}
