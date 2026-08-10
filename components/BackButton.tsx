"use client";

import { useRouter, usePathname } from "next/navigation";

export function BackButton({ label }: { label: string }) {
  const router = useRouter();
  const pathname = usePathname();

  // Nothing meaningful to go "back" to from the homepage itself.
  if (pathname === "/") return null;

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mx-auto flex max-w-6xl items-center gap-1.5 px-4 pt-4 text-sm text-neutral-500 hover:text-brand-black md:px-6"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4">
        <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {label}
    </button>
  );
}
