"use client";

import { useState } from "react";
import { updateProfile } from "./actions";

export function ProfileEditForm({ name, phone }: { name: string; phone: string | null }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-neutral-500 underline underline-offset-2 hover:text-brand-black">
        Modifier mes infos
      </button>
    );
  }

  return (
    <form action={updateProfile} className="mt-2 flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs text-neutral-500">Nom</label>
        <input name="name" defaultValue={name} className="border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-black focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs text-neutral-500">Téléphone</label>
        <input name="phone" defaultValue={phone ?? ""} className="border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-black focus:outline-none" />
      </div>
      <button type="submit" className="bg-brand-black px-3 py-1.5 text-xs uppercase tracking-wide text-white hover:opacity-90">
        Enregistrer
      </button>
    </form>
  );
}
