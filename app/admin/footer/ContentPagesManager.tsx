"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  renamePage,
  deleteContentPage,
  addTextBlock,
  addImagesBlock,
  updateBlockText,
  deleteBlock,
  moveBlock,
  uploadBlockImage,
  removeBlockImage,
} from "./actions";

type Block = { id: string; type: "text" | "images"; text: string | null; image_urls: string[] };
type ContentPage = { id: string; title: string; blocks: Block[] };

function TextBlockEditor({ pageId, block, isFirst, isLast }: { pageId: string; block: Block; isFirst: boolean; isLast: boolean }) {
  const [text, setText] = useState(block.text ?? "");
  const [, startTransition] = useTransition();

  return (
    <div className="border border-neutral-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Text</p>
        <BlockControls pageId={pageId} blockId={block.id} isFirst={isFirst} isLast={isLast} />
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => startTransition(() => updateBlockText(block.id, text))}
        rows={4}
        placeholder="Write anything you want here..."
        className="w-full border border-neutral-300 px-2 py-1.5 text-sm focus:border-brand-black focus:outline-none"
      />
    </div>
  );
}

function ImagesBlockEditor({ pageId, block, isFirst, isLast }: { pageId: string; block: Block; isFirst: boolean; isLast: boolean }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  return (
    <div className="border border-neutral-200 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-neutral-400">Photo gallery (scrolls on the page)</p>
        <BlockControls pageId={pageId} blockId={block.id} isFirst={isFirst} isLast={isLast} />
      </div>
      <div className="flex flex-wrap gap-2">
        {block.image_urls.map((url) => (
          <div key={url} className="relative h-20 w-20 shrink-0 overflow-hidden rounded border border-neutral-200">
            <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => startTransition(() => removeBlockImage(block.id, url))}
              className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1 text-xs text-white"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded border border-dashed border-neutral-300 text-[10px] text-neutral-400 hover:border-brand-black disabled:opacity-50"
        >
          {uploading ? "..." : "+ Add photo"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setUploading(true);
            const fd = new FormData();
            fd.set("image", file);
            try {
              await uploadBlockImage(block.id, fd);
            } finally {
              setUploading(false);
              if (fileRef.current) fileRef.current.value = "";
            }
          }}
        />
      </div>
    </div>
  );
}

function BlockControls({ pageId, blockId, isFirst, isLast }: { pageId: string; blockId: string; isFirst: boolean; isLast: boolean }) {
  const [, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-500">
      <button type="button" disabled={isFirst} onClick={() => startTransition(() => moveBlock(blockId, pageId, "up"))} className="disabled:opacity-30">
        ↑
      </button>
      <button type="button" disabled={isLast} onClick={() => startTransition(() => moveBlock(blockId, pageId, "down"))} className="disabled:opacity-30">
        ↓
      </button>
      <button type="button" onClick={() => startTransition(() => deleteBlock(blockId))} className="hover:text-red-600">
        Delete
      </button>
    </div>
  );
}

function ContentPageCard({ page }: { page: ContentPage }) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [, startTransition] = useTransition();

  return (
    <div className="mb-4 rounded-md border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        {editingTitle ? (
          <div className="flex flex-1 items-center gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 border border-neutral-300 px-2 py-1 text-sm font-medium focus:border-brand-black focus:outline-none"
            />
            <button
              type="button"
              className="text-xs text-brand-red"
              onClick={() => {
                startTransition(() => renamePage(page.id, title));
                setEditingTitle(false);
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <p className="text-sm font-medium">{page.title}</p>
        )}
        <div className="flex shrink-0 items-center gap-3 text-xs text-neutral-500">
          {!editingTitle && (
            <button type="button" onClick={() => setEditingTitle(true)} className="hover:text-brand-black">
              Rename
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete the "${page.title}" page? Any footer link still pointing to it will stop working.`)) {
                startTransition(() => deleteContentPage(page.id));
              }
            }}
            className="hover:text-red-600"
          >
            Delete page
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {page.blocks.map((b, i) =>
          b.type === "text" ? (
            <TextBlockEditor key={b.id} pageId={page.id} block={b} isFirst={i === 0} isLast={i === page.blocks.length - 1} />
          ) : (
            <ImagesBlockEditor key={b.id} pageId={page.id} block={b} isFirst={i === 0} isLast={i === page.blocks.length - 1} />
          )
        )}
        {page.blocks.length === 0 && <p className="text-xs text-neutral-400">Empty page — add a block below.</p>}
      </div>

      <div className="mt-3 flex gap-2 border-t border-neutral-100 pt-3">
        <button
          type="button"
          onClick={() => startTransition(() => addTextBlock(page.id))}
          className="border border-brand-black px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white"
        >
          + Add text
        </button>
        <button
          type="button"
          onClick={() => startTransition(() => addImagesBlock(page.id))}
          className="border border-brand-black px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-brand-black hover:text-white"
        >
          + Add photos
        </button>
      </div>
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
    <div className="max-w-2xl">
      {pages.map((p) => (
        <ContentPageCard key={p.id} page={p} />
      ))}
    </div>
  );
}
