"use client";

import { useState, useTransition } from "react";
import { updateContentPage } from "./actions";

type ContentPage = { id: string; slug: string; title: string; body: string };

function ContentPageRow({ page }: { page: ContentPage }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="border-b border-neutral-100 py-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-2 w-full border border-neutral-300 px-2 py-1.5 text-sm font-medium focus:border-brand-black focus:outline-none"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          className="w-full border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-black focus:outline-none"
        />
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            className="text-xs text-brand-red"
            onClick={() => {
              startTransition(() => updateContentPage(page.id, title, body));
              setEditing(false);
            }}
          >
            Save
          </button>
          <button type="button" className="text-xs text-neutral-500" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 border-b border-neutral-100 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{page.title}</p>
        <p className="mt-0.5 truncate text-xs text-neutral-400">{page.body || "—"}</p>
      </div>
      <button type="button" onClick={() => setEditing(true)} className="shrink-0 text-xs text-neutral-500 hover:text-brand-black">
        Edit
      </button>
    </div>
  );
}

export function ContentPagesManager({ pages }: { pages: ContentPage[] }) {
  if (pages.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No pages yet — these are created automatically by the footer's Terms of Sale, Warranty, FAQ... links.
      </p>
    );
  }

  return (
    <div className="max-w-2xl rounded-md border border-neutral-200 bg-white px-4">
      {pages.map((p) => (
        <ContentPageRow key={p.id} page={p} />
      ))}
    </div>
  );
}
