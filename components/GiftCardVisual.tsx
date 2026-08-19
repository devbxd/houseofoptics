// Shared shell for how a House of Optics gift card looks — used both in
// the admin reveal (right after generating one) and the public reveal
// (when a customer redeems a code), so the two moments always match: cream
// card, serif title, a flat red ribbon-and-bow accent instead of a stock
// clipart bow. Each caller supplies its own content (code box, product,
// discount, ...) as children.
export function GiftCardVisual({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-black/10 bg-brand-beige shadow-xl">
      <div className="px-6 pb-8 pt-7 text-center sm:px-10">
        <p className="text-[11px] uppercase tracking-[0.35em] text-brand-red">House of Optics</p>
        <h2 className="mt-2 font-serif text-3xl uppercase tracking-wide text-brand-black">Gift Card</h2>

        <div className="mx-auto mt-5 flex max-w-[220px] items-center gap-3">
          <span className="h-px flex-1 bg-brand-red/60" />
          <BowIcon className="h-6 w-6 shrink-0 text-brand-red" />
          <span className="h-px flex-1 bg-brand-red/60" />
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function BowIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 12c-1.2-2.6-3.4-4.5-6-4.5A3 3 0 0 0 3 10.5c0 2 2 3.2 4 3.5-2 .3-4 1.5-4 3.5A3 3 0 0 0 6 20c2.6 0 4.8-1.9 6-4.5Z" />
      <path d="M12 12c1.2-2.6 3.4-4.5 6-4.5a3 3 0 0 1 3 3c0 2-2 3.2-4 3.5 2 .3 4 1.5 4 3.5a3 3 0 0 1-3 3c-2.6 0-4.8-1.9-6-4.5Z" />
      <circle cx="12" cy="12" r="1.6" />
    </svg>
  );
}
