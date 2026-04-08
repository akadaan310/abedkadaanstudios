'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Props {
  photos: string[];
  city: string;
}

export function SiteGallery({ photos, city }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const displayed = photos.slice(0, 8);
  const isOpen = lightboxIndex !== null;
  const count = displayed.length;

  function prev() {
    setLightboxIndex((i) => (i === null ? 0 : (i - 1 + count) % count));
  }

  function next() {
    setLightboxIndex((i) => (i === null ? 0 : (i + 1) % count));
  }

  function close() {
    setLightboxIndex(null);
  }

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, lightboxIndex]);

  if (displayed.length < 2) return null;

  return (
    <section id="gallery" className="bg-[var(--color-background)] py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[var(--color-accent)]" />
            <span className="text-[var(--color-accent)] text-xs font-semibold uppercase tracking-[0.2em]">
              Portfolio
            </span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-text)] leading-tight tracking-tight">
            Our Work in {city}
          </h2>
        </div>

        {/* Uniform 4×2 square grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {displayed.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setLightboxIndex(i)}
              className="relative aspect-square overflow-hidden rounded-xl group focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
              aria-label={`View photo ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${city} work photo ${i + 1}`}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-10 h-10 rounded-full border border-white/80 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {isOpen && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={close}
        >
          {/* Blurred backdrop */}
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm" />

          {/* Close */}
          <button
            onClick={close}
            aria-label="Close lightbox"
            className="absolute top-5 right-5 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white/50 text-sm tabular-nums">
            {lightboxIndex + 1} / {count}
          </div>

          {/* Prev */}
          {count > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev(); }}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Image */}
          <div className="relative z-10" onClick={(e) => e.stopPropagation()}>
            <Image
              src={displayed[lightboxIndex]}
              alt={`${city} work photo ${lightboxIndex + 1}`}
              width={1200}
              height={900}
              style={{ maxHeight: '88vh', maxWidth: '88vw', objectFit: 'contain' }}
              className="rounded-xl shadow-2xl"
              priority
            />
          </div>

          {/* Next */}
          {count > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next(); }}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      )}
    </section>
  );
}
