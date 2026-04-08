'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Review } from '@/types/lead';

interface Props {
  reviews: Review[];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function SiteReviewsCarousel({ reviews: rawReviews }: Props) {
  const reviews = rawReviews.filter((r) => r.text?.trim());
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<'left' | 'right'>('right');
  const [animKey, setAnimKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const total = reviews.length;

  const navigate = useCallback((delta: number) => {
    setDir(delta >= 0 ? 'right' : 'left');
    setAnimKey((k) => k + 1);
    setIndex((prev) => ((prev + delta) % total + total) % total);
  }, [total]);

  const goTo = useCallback((next: number, currentIndex: number) => {
    const delta = next - currentIndex;
    // Use shortest-path direction for dots
    setDir(delta >= 0 ? 'right' : 'left');
    setAnimKey((k) => k + 1);
    setIndex(((next % total) + total) % total);
  }, [total]);

  // Auto-advance
  useEffect(() => {
    if (total === 0) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => navigate(1), 5000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [index, navigate, total]);

  if (!reviews.length) return null;

  const visibleCount = Math.min(3, total);
  const visible = Array.from({ length: visibleCount }, (_, i) => reviews[(index + i) % total]);

  return (
    <section id="reviews" className="bg-[var(--color-text)] py-28 overflow-hidden">
      {/* Slide keyframes */}
      <style>{`
        @keyframes reviewSlideRight {
          from { opacity: 0; transform: translateX(48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes reviewSlideLeft {
          from { opacity: 0; transform: translateX(-48px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-14">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-[var(--color-accent)]" />
              <span className="text-[var(--color-accent)] text-xs font-semibold uppercase tracking-[0.2em]">
                Testimonials
              </span>
            </div>
            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight">
              What Our Customers Say
            </h2>
          </div>

          {/* Arrow buttons + counter — desktop only */}
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => navigate(-1)}
              aria-label="Previous reviews"
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-white/50 hover:text-white transition-all duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span className="text-white/30 text-sm tabular-nums min-w-[48px] text-center">
              {index + 1} / {total}
            </span>
            <button
              onClick={() => navigate(1)}
              aria-label="Next reviews"
              className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:border-white/50 hover:text-white transition-all duration-200"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Animated cards grid — flanked by arrows on mobile */}
        <div className="relative">
          {/* Mobile: left arrow */}
          <button
            onClick={() => navigate(-1)}
            aria-label="Previous reviews"
            className="sm:hidden absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          {/* Mobile: right arrow */}
          <button
            onClick={() => navigate(1)}
            aria-label="Next reviews"
            className="sm:hidden absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

        <div
          key={animKey}
          className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:mx-0 mx-6"
          style={{
            animation: `${dir === 'right' ? 'reviewSlideRight' : 'reviewSlideLeft'} 0.38s cubic-bezier(0.25,0.46,0.45,0.94) both`,
          }}
        >
          {visible.map((review, i) => {
            const initials = getInitials(review.reviewer);
            const filled = Math.min(Math.max(Math.round(review.stars), 0), 5);
            const isFirst = i === 0;

            return (
              <div
                key={`${(index + i) % total}`}
                className={`flex flex-col rounded-2xl p-7 border ${i > 0 ? 'hidden sm:flex' : 'flex'} ${
                  isFirst
                    ? 'bg-[var(--color-accent)]/10 border-[var(--color-accent)]/20'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {/* Quote mark */}
                <span className="font-[var(--font-display)] text-4xl leading-none text-[var(--color-accent)]/30 mb-4 block">
                  &ldquo;
                </span>

                {/* Stars */}
                <div className="flex gap-0.5 mb-4" aria-label={`${review.stars} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, idx) => (
                    <span
                      key={idx}
                      className="text-sm"
                      style={{ color: idx < filled ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)' }}
                    >
                      ★
                    </span>
                  ))}
                </div>

                {/* Review text */}
                <p className="text-white/70 text-sm leading-relaxed flex-1 line-clamp-5">
                  {review.text}
                </p>

                {/* Reviewer */}
                <div className="flex items-center gap-3 mt-6 pt-5 border-t border-white/10">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                    style={{ backgroundColor: 'var(--color-accent)', opacity: 0.8 }}
                  >
                    {initials}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm leading-tight">{review.reviewer}</p>
                    <p className="text-white/35 text-xs mt-0.5">{formatDate(review.date)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>{/* end relative wrapper */}

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-1.5 mt-10">
          {reviews.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i, index)}
              aria-label={`Go to review ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-5 h-1.5 bg-[var(--color-accent)]'
                  : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
