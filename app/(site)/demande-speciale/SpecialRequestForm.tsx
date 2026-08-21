"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { uploadSpecialRequestPhoto } from "./actions";

function waLink(number: string, message: string) {
  const digits = number.replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function SpecialRequestForm({ whatsappNumber, t }: { whatsappNumber: string; t: Record<string, string> }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !description.trim()) return;
    if (!whatsappNumber) {
      setError(t["specialRequest.noWhatsapp"]);
      return;
    }

    setSending(true);
    setError(null);
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const fd = new FormData();
        fd.set("photo", photo);
        const result = await uploadSpecialRequestPhoto(fd);
        photoUrl = result.url;
      }

      const lines = [
        `${t["specialRequest.whatsappIntro"]}`,
        "",
        `${t["specialRequest.whatsappName"]}: ${name}`,
        `${t["specialRequest.whatsappDescription"]}: ${description}`,
        photoUrl ? `${t["specialRequest.whatsappPhoto"]}: ${photoUrl}` : null,
      ].filter((l) => l !== null);

      window.open(waLink(whatsappNumber, lines.join("\n")), "_blank", "noopener,noreferrer");
    } catch {
      setError(t["checkout.genericError"]);
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label className="mb-1 block text-sm text-neutral-600">{t["specialRequest.name"]}</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">{t["specialRequest.description"]}</label>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t["specialRequest.descriptionPlaceholder"]}
          className="w-full border border-neutral-300 px-3 py-2.5 text-sm focus:border-brand-black focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-neutral-600">{t["specialRequest.photo"]}</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setPhoto(file);
            setPhotoPreview(file ? URL.createObjectURL(file) : null);
          }}
          className="w-full text-sm"
        />
        {photoPreview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoPreview} alt="" className="mt-3 h-28 w-28 rounded object-cover" />
        )}
      </div>

      {error && <p className="text-sm text-brand-red">{error}</p>}

      <button
        type="submit"
        disabled={sending || !name.trim() || !description.trim()}
        className="flex w-full items-center justify-center gap-2 bg-green-600 py-3 text-sm uppercase tracking-widest text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-4 w-4 shrink-0">
          <path
            d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {sending ? t["specialRequest.sending"] : t["specialRequest.submit"]}
      </button>
    </form>
  );
}
