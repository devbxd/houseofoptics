"use client";

import { useState, useTransition } from "react";
import {
  createFooterSection,
  renameFooterSection,
  deleteFooterSection,
  moveFooterSection,
  addFooterLink,
  renameFooterLink,
  deleteFooterLink,
  moveFooterLink,
} from "./actions";

type Link = { id: string; label: string; url: string };
type Section = { id: string; title: string; links: Link[] };

function LinkRow({ sectionId, link, isFirst, isLast }: { sectionId: string; link: Link; isFirst: boolean; isLast: boolean }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(link.label);
  const [, startTransition] = useTransition();

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2 py-1.5">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="flex-1 border border-neutral-300 px-2 py-1 text-xs focus:border-brand-black focus:outline-none"
        />
        <button
          type="button"
          className="text-xs text-brand-red"
          onClick={() => {
            startTransition(() => renameFooterLink(link.id, label));
            setEditing(false);
          }}
        >
          Save
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1.5 text-sm">
      <span className="truncate">
        {link.label} <span className="text-xs text-neutral-400">— {link.url}</span>
      </span>
      <div className="flex shrink-0 items-center gap-2 text-xs text-neutral-500">
        <button type="button" disabled={isFirst} onClick={() => startTransition(() => moveFooterLink(link.id, sectionId, "up"))} className="disabled:opacity-30">
          ↑
        </button>
        <button type="button" disabled={isLast} onClick={() => startTransition(() => moveFooterLink(link.id, sectionId, "down"))} className="disabled:opacity-30">
          ↓
        </button>
        <button type="button" onClick={() => setEditing(true)} className="hover:text-brand-black">
          Rename
        </button>
        <button type="button" onClick={() => startTransition(() => deleteFooterLink(link.id))} className="hover:text-red-600">
          Delete
        </button>
      </div>
    </div>
  );
}

function SectionCard({ section, isFirst, isLast }: { section: Section; isFirst: boolean; isLast: boolean }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(section.title);
  const [newLabel, setNewLabel] = useState("");
  const [, startTransition] = useTransition();

  return (
    <div className="mb-4 rounded-md border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        {editingTitle ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 border border-neutral-300 px-2 py-1 text-sm focus:border-brand-black focus:outline-none"
            />
            <button
              type="button"
              className="text-xs text-brand-red"
              onClick={() => {
                startTransition(() => renameFooterSection(section.id, title));
                setEditingTitle(false);
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium">{section.title}</p>
        )}
        <div className="flex shrink-0 items-center gap-2 text-xs text-neutral-500">
          <button type="button" disabled={isFirst} onClick={() => startTransition(() => moveFooterSection(section.id, "up"))} className="disabled:opacity-30">
            ↑
          </button>
          <button type="button" disabled={isLast} onClick={() => startTransition(() => moveFooterSection(section.id, "down"))} className="disabled:opacity-30">
            ↓
          </button>
          {!editingTitle && (
            <button type="button" onClick={() => setEditingTitle(true)} className="hover:text-brand-black">
              Rename
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete section "${section.title}" and all its links?`)) {
                startTransition(() => deleteFooterSection(section.id));
              }
            }}
            className="hover:text-red-600"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="divide-y divide-neutral-100 border-t border-neutral-100">
        {section.links.map((l, i) => (
          <LinkRow key={l.id} sectionId={section.id} link={l} isFirst={i === 0} isLast={i === section.links.length - 1} />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Link text (e.g. Size Guide)"
          className="flex-1 border border-neutral-300 px-2 py-1.5 text-xs focus:border-brand-black focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            if (!newLabel.trim()) return;
            startTransition(() => addFooterLink(section.id, newLabel));
            setNewLabel("");
          }}
          className="shrink-0 border border-brand-black px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white"
        >
          Add link
        </button>
      </div>
      <p className="mt-1.5 text-xs text-neutral-400">A new page is created automatically — edit its text in "Page content" below.</p>
    </div>
  );
}

export function FooterSectionsManager({ sections }: { sections: Section[] }) {
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [, startTransition] = useTransition();

  return (
    <div>
      {sections.map((s, i) => (
        <SectionCard key={s.id} section={s} isFirst={i === 0} isLast={i === sections.length - 1} />
      ))}

      <div className="flex max-w-md items-center gap-2">
        <input
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder="New section title (e.g. Customer Area)"
          className="flex-1 border border-neutral-300 px-3 py-2 text-sm focus:border-brand-black focus:outline-none"
        />
        <button
          type="button"
          onClick={() => {
            if (!newSectionTitle.trim()) return;
            const fd = new FormData();
            fd.set("title", newSectionTitle);
            startTransition(() => createFooterSection(fd));
            setNewSectionTitle("");
          }}
          className="shrink-0 border border-brand-black px-4 py-2 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white"
        >
          Add section
        </button>
      </div>
    </div>
  );
}
