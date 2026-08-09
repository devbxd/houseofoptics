"use client";

import { useTransition } from "react";
import { togglePopup, deletePopup } from "./actions";

type Popup = {
  id: string;
  title: string;
  description: string;
  discount_percent: number | null;
  max_uses: number | null;
  duration_days: number | null;
  is_active: boolean;
  created_at: string;
  usesCount: number | null;
};

export function PopupRow({ popup }: { popup: Popup }) {
  const [pending, startTransition] = useTransition();

  const daysLeft =
    popup.duration_days != null
      ? Math.max(
          0,
          popup.duration_days - Math.floor((Date.now() - new Date(popup.created_at).getTime()) / 86400000)
        )
      : null;

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{popup.title}</p>
          {popup.description && <p className="mt-1 text-sm text-neutral-600">{popup.description}</p>}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-neutral-500">
            {popup.discount_percent != null && <span>{popup.discount_percent}% off</span>}
            {popup.max_uses != null && (
              <span>
                {popup.usesCount ?? 0} / {popup.max_uses} orders used
              </span>
            )}
            {daysLeft != null && (
              <span>
                {daysLeft} day{daysLeft === 1 ? "" : "s"} left
              </span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={popup.is_active}
              disabled={pending}
              onChange={(e) => startTransition(() => togglePopup(popup.id, e.target.checked))}
            />
            Active
          </label>
          <button
            type="button"
            disabled={pending}
            onClick={() => startTransition(() => deletePopup(popup.id))}
            className="text-xs text-neutral-400 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
