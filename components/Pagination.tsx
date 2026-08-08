import Link from "next/link";

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  let start: number;
  let end: number;
  if (current <= 3) {
    start = 2;
    end = 5;
  } else if (current >= total - 2) {
    start = total - 4;
    end = total - 1;
  } else {
    start = current - 1;
    end = current + 1;
  }

  const pages: (number | "...")[] = [1];
  if (start > 2) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

export function Pagination({
  page,
  total,
  pageSize,
  basePath,
}: {
  page: number;
  total: number;
  pageSize: number;
  basePath: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  if (pageCount <= 1) return null;

  const sep = basePath.includes("?") ? "&" : "?";
  const hrefFor = (p: number) => `${basePath}${sep}page=${p}`;
  const pages = getPageNumbers(page, pageCount);

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-1 text-sm">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        aria-label="Previous page"
        className={`flex h-8 w-8 items-center justify-center ${page <= 1 ? "pointer-events-none text-neutral-300" : "text-neutral-500 hover:text-brand-red"}`}
      >
        ‹
      </Link>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="flex h-8 w-8 items-center justify-center text-neutral-400">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            aria-current={p === page ? "page" : undefined}
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              p === page ? "bg-brand-black text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={hrefFor(Math.min(pageCount, page + 1))}
        aria-disabled={page >= pageCount}
        aria-label="Next page"
        className={`flex h-8 w-8 items-center justify-center ${page >= pageCount ? "pointer-events-none text-neutral-300" : "text-neutral-500 hover:text-brand-red"}`}
      >
        ›
      </Link>
    </div>
  );
}
