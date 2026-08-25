"use client";

import { useState } from "react";
import { submitTestimonial } from "@/app/(site)/testimonial-actions";

type Product = { id: string; name: string };

export function FeedbackForm({ t, products = [] }: { t: Record<string, string>; products?: Product[] }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

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

  function close() {
    setOpen(false);
    // Reset for next time, once the closing transition would be done —
    // no transition here, so this is instant, but keeps state clean if
    // the form was left mid-fill or already submitted.
    setStatus("idle");
    setRating(0);
  }

  return (
    <div className="mt-10 text-center">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-brand-black px-8 py-3 text-xs uppercase tracking-[0.2em] transition-colors hover:bg-brand-black hover:text-white"
      >
        {t["feedback.cta"]}
      </button>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={close}>
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-md bg-white p-6 text-left shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-xl">{t["feedback.cta"]}</h3>
              <button type="button" onClick={close} aria-label={t["product.visualizeClose"]} className="text-2xl leading-none text-neutral-400 hover:text-brand-black">
                ×
              </button>
            </div>

            {status === "done" ? (
              <p className="py-6 text-center text-sm text-neutral-700">{t["feedback.thanks"]}</p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm text-neutral-600">{t["feedback.name"]}</label>
                  <input
                    name="author_name"
                    required
                    className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                  />
                </div>

                {products.length > 0 && (
                  <div>
                    <label className="mb-1 block text-sm text-neutral-600">{t["feedback.product"]}</label>
                    <select
                      name="product_id"
                      defaultValue=""
                      className="w-full border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
                    >
                      <option value="">{t["feedback.productGeneral"]}</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
