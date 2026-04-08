import Image from 'next/image';

interface Props {
  photoHero: string | null;
  headline: string | null;
  subheadline: string | null;
  phone: string | null;
  ctaTagline: string | null;
}

export function SiteHero({ photoHero, headline, subheadline, phone, ctaTagline }: Props) {
  const dialNumber = phone ? phone.replace(/\D/g, '') : null;

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      {/* Background image */}
      {photoHero ? (
        <Image
          src={photoHero}
          alt={headline ?? 'Hero background'}
          fill
          priority
          className="object-cover object-center scale-[1.02]"
          sizes="100vw"
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--color-primary)]" />
      )}

      {/* Layered gradient — cinematic bottom-up */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Content — anchored to bottom */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-6 lg:px-10 pb-20 pt-40">
        {/* Eyebrow */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-8 h-px bg-[var(--color-accent)]" />
          <span className="text-[var(--color-accent)] text-xs font-semibold uppercase tracking-[0.2em]">
            Trusted Local Experts
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-[var(--font-display)] text-5xl sm:text-6xl md:text-7xl font-bold text-white leading-[1.05] max-w-3xl mb-6 tracking-tight">
          {headline ?? ''}
        </h1>

        {subheadline && (
          <p className="text-lg text-white/70 max-w-xl mb-10 leading-relaxed font-light">
            {subheadline}
          </p>
        )}

        {/* CTA row */}
        <div className="flex flex-wrap items-center gap-4 mb-16">
          {dialNumber && (
            <a
              href={`tel:${dialNumber}`}
              className="inline-flex items-center gap-3 bg-[var(--color-accent)] text-white font-semibold px-8 py-4 rounded-full text-[15px] hover:opacity-90 transition-all duration-200 shadow-2xl"
            >
              <PhoneIcon />
              {ctaTagline ?? 'Call Now'}
            </a>
          )}
          <a
            href="#lead-form"
            className="inline-flex items-center gap-2 text-white/80 font-medium text-[15px] hover:text-white transition-colors group"
          >
            Send Us a Note
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="transition-transform duration-200 group-hover:translate-x-1">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-50">
        <span className="text-white text-[10px] uppercase tracking-widest">Scroll</span>
        <div className="w-px h-8 bg-white/40 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full bg-white animate-[scrollDrop_1.6s_ease-in-out_infinite]" style={{ height: '40%' }} />
        </div>
      </div>
    </section>
  );
}

function PhoneIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z" />
    </svg>
  );
}

