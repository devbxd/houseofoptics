type Review = { id: string; author_name: string; quote: string; rating: number | null };

export function ProductReviews({ reviews, title }: { reviews: Review[]; title: string }) {
  if (reviews.length === 0) return null;

  const withRating = reviews.filter((r) => r.rating != null);
  const average = withRating.length
    ? withRating.reduce((sum, r) => sum + (r.rating as number), 0) / withRating.length
    : null;

  return (
    <section className="mt-16 border-t border-neutral-200 pt-10">
      <div className="mb-8 flex items-center justify-center gap-3">
        <h2 className="text-center font-serif text-2xl">{title}</h2>
        {average != null && (
          <span className="text-sm text-neutral-500">
            {"★".repeat(Math.round(average))}
            {"☆".repeat(5 - Math.round(average))} ({reviews.length})
          </span>
        )}
      </div>
      <div className="mx-auto grid max-w-3xl gap-6 sm:grid-cols-2">
        {reviews.map((r) => (
          <div key={r.id} className="border border-neutral-200 p-5 text-sm">
            {r.rating && <p className="mb-2 text-brand-red">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>}
            <p className="text-neutral-700">&ldquo;{r.quote}&rdquo;</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-neutral-400">{r.author_name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
