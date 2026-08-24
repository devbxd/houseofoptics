"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-serif text-2xl text-brand-black">Un problème est survenu.</p>
      <p className="max-w-md text-sm text-neutral-500">
        Quelque chose s&apos;est mal passé sur cette page. Réessayez, ou retournez à l&apos;accueil.
      </p>
      <div className="mt-2 flex gap-3">
        <button
          onClick={() => reset()}
          className="bg-brand-black px-5 py-2.5 text-xs uppercase tracking-widest text-white hover:opacity-90"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="border border-neutral-300 px-5 py-2.5 text-xs uppercase tracking-widest text-neutral-700 hover:border-brand-black"
        >
          Accueil
        </Link>
      </div>
    </div>
  );
}
