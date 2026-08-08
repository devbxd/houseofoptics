"use client";

import { useState } from "react";
import { submitTestimonial } from "@/app/(site)/testimonial-actions";

export function FeedbackForm({ t }: { t: Record<string, string> }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  if (status === "done") {
    return (
      <div className="mx-auto mt-10 max-w-md text-center">
        <p className="text-sm text-neutral-700">{t["feedback.thanks"]}</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="mt-10 text-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="border border-brand-black px-8 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-brand-black hover:text-white"
        >
          {t["feedback.cta"]}
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    try {
      const formData = new FormData(e.currentTarget);
      if (rating > 0) formData.set("rating", String(rating));
      const { error } = await submitTestimonial(formData);
      setStatus(error ? "error" : "done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-md space-y-3 text-left">
      <h3 className="text-center font-serif text-xl">{t["feedback.cta"]}</h3>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">{t["feedback.name"]}</label>
        <input
          name="author_name"
          required
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">{t["feedback.rating"]}</label>
        <div className="flex gap-1 text-2xl">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              className={n <= rating ? "text-brand-red" : "text-neutral-300"}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">{t["feedback.quote"]}</label>
        <textarea
          name="quote"
          rows={4}
          required
          className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">{t["feedback.photo"]}</label>
        <input name="photo" type="file" accept="image/*" className="w-full text-sm" />
      </div>

      {status === "error" && <p className="text-sm text-brand-red">{t["checkout.genericError"]}</p>}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-brand-black py-3 text-center text-sm uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-50"
      >
        {status === "loading" ? t["feedback.sending"] : t["feedback.submit"]}
      </button>
    </form>
  );
}
