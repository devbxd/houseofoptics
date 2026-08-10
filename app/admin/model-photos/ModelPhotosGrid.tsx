"use client";

import Image from "next/image";
import { deleteModelPhoto } from "./actions";

type Photo = { id: string; image_url: string; productName: string };

export function ModelPhotosGrid({ photos }: { photos: Photo[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((p) => (
        <div key={p.id} className="rounded-md border border-neutral-200 bg-white p-2">
          <div className="relative mb-2 aspect-[3/4] overflow-hidden rounded bg-neutral-100">
            <Image src={p.image_url} alt="" fill sizes="200px" className="object-cover" />
          </div>
          <p className="mb-2 truncate text-xs text-neutral-600">{p.productName}</p>
          <button
            type="button"
            onClick={async () => {
              await deleteModelPhoto(p.id);
            }}
            className="text-xs text-neutral-400 hover:text-red-600"
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
