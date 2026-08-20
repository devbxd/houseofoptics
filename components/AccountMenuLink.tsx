"use client";

import Link from "next/link";
import { useCustomerAuth } from "./CustomerAuthProvider";

// Desktop header version — a plain "Log in" link when signed out, a small
// initials avatar linking to /compte once signed in, so there's always a
// visible way to reach the account without needing the hamburger menu.
export function AccountMenuLink({ className, t }: { className?: string; t: Record<string, string> }) {
  const { user, name, loading } = useCustomerAuth();

  if (loading) return <span className={className} aria-hidden />;

  if (!user) {
    return (
      <Link href="/compte/connexion" className={className}>
        {t["nav.login"]}
      </Link>
    );
  }

  const initial = (name || user.email || "?").trim().charAt(0).toUpperCase();

  return (
    <Link
      href="/compte"
      aria-label={t["nav.account"]}
      className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-black text-xs font-medium text-white"
    >
      {initial}
    </Link>
  );
}
