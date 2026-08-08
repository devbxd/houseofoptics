"use client";

import { useState } from "react";
import { subscribeToNewsletter } from "@/app/(site)/newsletter-actions";

export function NewsletterForm({ t }: { t: Record<string, string> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const { error } = await subscribeToNewsletter(email);
      setStatus(error ? "error" : "done");
    } catch {
      // Never leave the button stuck on "loading" — an unexpected error
      // still needs to resolve to a state the visitor can act on.
      setStatus("error");
    }
  }

  if (status === "done") {
    return <p className="mt-6 text-sm text-neutral-700">{t["newsletter.thanks"]}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-6 flex max-w-sm gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t["newsletter.placeholder"]}
        className="flex-1 border border-neutral-300 px-4 py-2 text-sm focus:border-brand-black focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="bg-brand-black px-5 py-2 text-sm uppercase tracking-wide text-white hover:opacity-90 disabled:opacity-50"
      >
        {t["newsletter.subscribe"]}
      </button>
      {status === "error" && (
        <p className="basis-full text-sm text-brand-red">{t["checkout.genericError"]}</p>
      )}
    </form>
  );
}
