import Link from "next/link";
import { getServerDict } from "@/lib/locale-server";

export default async function ComingSoonPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const { title } = await searchParams;
  const { t } = await getServerDict();

  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="font-serif text-2xl">{title || t["comingSoon.title"]}</h1>
      <p className="mx-auto mt-4 max-w-sm text-sm text-neutral-500">{t["comingSoon.text"]}</p>
      <Link
        href="/"
        className="mt-8 inline-block border border-brand-black px-8 py-3 text-xs uppercase tracking-widest text-brand-black transition-colors hover:bg-brand-black hover:text-white"
      >
        {t["comingSoon.back"]}
      </Link>
    </main>
  );
}
