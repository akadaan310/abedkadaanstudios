'use client';

import { useEffect, useState } from 'react';

interface Props {
  name: string;
  phone: string | null;
}

const NAV_LINKS = ['Services', 'Gallery', 'Reviews', 'About', 'Contact'];

export function SiteNav({ name, phone }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          scrolled || menuOpen
            ? 'bg-[var(--color-surface)]/95 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.06)]'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-20">
          {/* Business name */}
          <span
            className={`font-[var(--font-display)] text-lg font-bold tracking-tight transition-colors duration-300 ${
              scrolled || menuOpen ? 'text-[var(--color-text)]' : 'text-white'
            }`}
          >
            {name}
          </span>

          {/* Desktop links */}
          <ul className="hidden md:flex items-center gap-10">
            {NAV_LINKS.map((label) => (
              <li key={label}>
                <a
                  href={`#${label.toLowerCase()}`}
                  className={`text-[13px] font-medium tracking-wide uppercase transition-colors duration-200 relative group ${
                    scrolled
                      ? 'text-[var(--color-text-light)] hover:text-[var(--color-text)]'
                      : 'text-white/80 hover:text-white'
                  }`}
                >
                  {label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[var(--color-accent)] transition-all duration-300 group-hover:w-full" />
                </a>
              </li>
            ))}
          </ul>

          {/* Desktop phone CTA */}
          {phone && (
            <a
              href={`tel:${phone.replace(/\D/g, '')}`}
              className={`hidden md:flex items-center gap-2.5 text-sm font-semibold px-5 py-2.5 rounded-full border transition-all duration-300 ${
                scrolled
                  ? 'border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white'
                  : 'border-white/60 text-white hover:border-white hover:bg-white/10'
              }`}
            >
              <PhoneIcon />
              {phone}
            </a>
          )}

          {/* Hamburger button — mobile only */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className={`md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg transition-colors ${
              scrolled || menuOpen ? 'text-[var(--color-text)]' : 'text-white'
            }`}
          >
            <span
              className={`block w-6 h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${
                menuOpen ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current rounded-full transition-all duration-300 ${
                menuOpen ? 'opacity-0 scale-x-0' : ''
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-current rounded-full transition-all duration-300 origin-center ${
                menuOpen ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          onClick={closeMenu}
          className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Drawer */}
        <div
          className={`absolute top-20 inset-x-0 bg-[var(--color-surface)] shadow-2xl transition-all duration-300 ease-out ${
            menuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-3'
          }`}
        >
          <ul className="px-6 pt-6 pb-4 space-y-1">
            {NAV_LINKS.map((label, i) => (
              <li key={label}>
                <a
                  href={`#${label.toLowerCase()}`}
                  onClick={closeMenu}
                  className="flex items-center justify-between py-4 text-base font-medium text-[var(--color-text)] hover:text-[var(--color-accent)] transition-colors border-b border-[var(--color-text-light)]/10 last:border-0"
                  style={{ transitionDelay: menuOpen ? `${i * 40}ms` : '0ms' }}
                >
                  {label}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-30">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </a>
              </li>
            ))}
          </ul>

          {phone && (
            <div className="px-6 pb-8 pt-2">
              <a
                href={`tel:${phone.replace(/\D/g, '')}`}
                onClick={closeMenu}
                className="flex items-center justify-center gap-2.5 w-full bg-[var(--color-accent)] text-white font-semibold py-4 rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                <PhoneIcon />
                {phone}
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z" />
    </svg>
  );
}
