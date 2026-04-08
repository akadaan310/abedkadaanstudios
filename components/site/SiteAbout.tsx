interface Props {
  text: string;
  rating: number | null;
  reviewCount: number | null;
}

export function SiteAbout({ text, rating, reviewCount }: Props) {
  const paragraphs = text.split('\n\n').filter(Boolean);

  return (
    <section id="about" className="bg-[var(--color-surface)] py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* Left — copy */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-[var(--color-accent)]" />
              <span className="text-[var(--color-accent)] text-xs font-semibold uppercase tracking-[0.2em]">
                Our Story
              </span>
            </div>

            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-text)] leading-tight tracking-tight mb-8">
              About Us
            </h2>

            <div className="space-y-5">
              {paragraphs.map((para, i) => (
                <p key={i} className={`text-[var(--color-text-light)] leading-relaxed text-[15px] ${i === 0 ? 'text-[var(--color-text)] text-base font-medium' : ''}`}>
                  {para}
                </p>
              ))}
            </div>
          </div>

          {/* Right — stats panel */}
          <div className="relative">
            {/* Large decorative character */}
            <span
              className="absolute -top-8 -left-4 font-[var(--font-display)] text-[180px] font-bold leading-none select-none pointer-events-none"
              style={{ color: 'var(--color-accent)', opacity: 0.06 }}
              aria-hidden="true"
            >
              &ldquo;
            </span>

            <div className="relative grid grid-cols-2 gap-px bg-[var(--color-text-light)]/10 rounded-2xl overflow-hidden border border-[var(--color-text-light)]/10">
              {/* Stat 1 — Rating */}
              {rating !== null && (
                <div className="bg-[var(--color-surface)] p-8">
                  <p className="font-[var(--font-display)] text-5xl font-bold text-[var(--color-primary)] mb-1">
                    {rating.toFixed(1)}
                  </p>
                  <div className="flex gap-0.5 mb-2" aria-label={`${rating} out of 5 stars`}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className="text-sm"
                        style={{ color: i < Math.round(rating) ? 'var(--color-accent)' : 'var(--color-text-light)' }}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-[var(--color-text-light)] uppercase tracking-widest font-medium">Google Rating</p>
                </div>
              )}

              {/* Stat 2 — Reviews */}
              {reviewCount !== null && (
                <div className="bg-[var(--color-surface)] p-8">
                  <p className="font-[var(--font-display)] text-5xl font-bold text-[var(--color-primary)] mb-1">
                    {reviewCount.toLocaleString()}
                  </p>
                  <p className="text-sm text-[var(--color-text-light)] mb-2">Verified reviews</p>
                  <p className="text-xs text-[var(--color-text-light)] uppercase tracking-widest font-medium">& Counting</p>
                </div>
              )}

              {/* Stat 3 */}
              <div className="bg-[var(--color-surface)] p-8">
                <p className="font-[var(--font-display)] text-5xl font-bold text-[var(--color-primary)] mb-1">
                  100%
                </p>
                <p className="text-sm text-[var(--color-text-light)] mb-2">Satisfaction rate</p>
                <p className="text-xs text-[var(--color-text-light)] uppercase tracking-widest font-medium">Guaranteed</p>
              </div>

              {/* Stat 4 */}
              <div className="bg-[var(--color-surface)] p-8">
                <p className="font-[var(--font-display)] text-5xl font-bold text-[var(--color-primary)] mb-1">
                  24/7
                </p>
                <p className="text-sm text-[var(--color-text-light)] mb-2">Emergency support</p>
                <p className="text-xs text-[var(--color-text-light)] uppercase tracking-widest font-medium">Always Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
