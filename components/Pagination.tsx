import Link from "next/link";

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

  return (
    <div className="mt-12 flex items-center justify-center gap-2 text-sm">
      <Link
        href={`${basePath}${sep}page=${Math.max(1, page - 1)}`}
        aria-disabled={page <= 1}
        className={`px-3 py-1.5 ${page <= 1 ? "pointer-events-none text-neutral-300" : "hover:text-brand-red"}`}
      >
        ‹
      </Link>
      <span className="text-neutral-500">
        {page} / {pageCount}
      </span>
      <Link
        href={`${basePath}${sep}page=${Math.min(pageCount, page + 1)}`}
        aria-disabled={page >= pageCount}
        className={`px-3 py-1.5 ${page >= pageCount ? "pointer-events-none text-neutral-300" : "hover:text-brand-red"}`}
      >
        ›
      </Link>
    </div>
  );
}
