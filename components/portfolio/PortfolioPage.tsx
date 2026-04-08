const features = [
  {
    name: 'Google Reviews Sync',
    description: 'Live top reviews pulled directly from Google Maps profile.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <line x1="12" y1="8" x2="12" y2="13" />
        <line x1="9.5" y1="10.5" x2="14.5" y2="10.5" />
      </svg>
    ),
  },
  {
    name: 'Custom Brand Design',
    description: 'Unique visual identity reflecting your business personality.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="6.5" cy="17.5" r="2.5" />
        <circle cx="17.5" cy="17.5" r="2.5" />
        <path d="M6.5 15V9l6 3.5" />
        <path d="M13.5 9v5.5l4 2.5" />
      </svg>
    ),
  },
  {
    name: 'Free Lifetime Hosting',
    description: 'No monthly costs. Save $1,800+ over 5 years.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 12c-2.5 0-4.5-1.5-4.5-3.5S9.5 5 12 5s4.5 1.5 4.5 3.5S14.5 12 12 12z" />
        <path d="M7.5 8.5C5.5 9.5 4 11 4 12.5c0 2.5 3.6 4.5 8 4.5s8-2 8-4.5c0-1.5-1.5-3-3.5-4" />
      </svg>
    ),
  },
  {
    name: 'On-Page SEO',
    description: 'Dominate local search rankings and bridge maps authority.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <polyline points="8 13 10 9 13 11 15 8" />
      </svg>
    ),
  },
  {
    name: 'Lead Capture',
    description: 'High-conversion forms delivering leads to your inbox.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="2" />
        <path d="M15 8h2M15 12h2M7 16h10" />
      </svg>
    ),
  },
  {
    name: 'Mobile-Ready Design',
    description: 'Optimized for local smartphone search performance.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
        <line x1="12" y1="18" x2="12.01" y2="18" />
      </svg>
    ),
  },
  {
    name: 'Hyper Speed',
    description: 'Sub-second load times keep potential leads engaged.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
  },
  {
    name: 'Domain Control',
    description: 'You own the asset; we handle the technical setup.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    ),
  },
  {
    name: 'Direct Access',
    description: 'Direct communication with the engineer, no middlemen.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
  },
];

export default function PortfolioPage() {
  return (
    <main
      className="md:h-screen md:overflow-hidden flex flex-col md:flex-row min-h-screen"
      style={{
        backgroundColor: '#0e0e0e',
        backgroundImage:
          'radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px)',
        backgroundSize: '3px 3px',
        fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif',
      }}
    >
      {/* Left column */}
      <div className="flex flex-col justify-center px-8 md:px-14 py-16 md:py-0 w-full md:w-[44%] md:shrink-0">
        {/* Studio name */}
        <p
          className="text-white text-xs font-bold mb-7"
          style={{ letterSpacing: '0.18em' }}
        >
          ABED KADAAN STUDIOS
        </p>

        {/* Badge */}
        <div
          className="w-fit border text-xs font-semibold px-4 py-2 mb-8"
          style={{
            borderColor: '#00e5ff',
            color: '#00e5ff',
            letterSpacing: '0.16em',
          }}
        >
          ONE-MAN DIGITAL AGENCY
        </div>

        {/* Headline */}
        <h1
          className="text-white font-black leading-[1.08] mb-5"
          style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)' }}
        >
          Professional{' '}
          <span style={{ color: '#00e5ff' }}>Lead Gen</span>
          <br />
          Website + Lifetime
          <br />
          Hosting.
        </h1>

        {/* Sub-copy */}
        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          Precision-engineered for local businesses. For a one-time fee of{' '}
          <strong className="text-white">$120</strong>.
        </p>

        {/* CTA button */}
        <a
          href="https://buy.stripe.com/eVq9AT8svfaYcoAg8f1kA00"
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-xs font-black px-8 py-4 mb-6 transition-opacity hover:opacity-90 inline-block"
          style={{
            backgroundColor: '#00e5ff',
            color: '#000',
            letterSpacing: '0.14em',
          }}
        >
          BUY $120 WEBSITE PACKAGE
        </a>

        {/* Zero subscriptions */}
        <div
          className="flex items-center gap-2 text-xs font-semibold"
          style={{ color: '#00e5ff', letterSpacing: '0.14em' }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          ZERO MONTHLY SUBSCRIPTIONS
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col justify-center px-8 md:px-10 pb-16 md:pb-0 w-full md:w-[56%]">
        {/* Section heading */}
        <div className="mb-8 text-center">
          <h2
            className="text-white text-base font-black mb-1"
            style={{ letterSpacing: '0.2em' }}
          >
            THE $120 ADVANTAGE
          </h2>
          <p
            className="text-xs font-semibold"
            style={{ color: '#00e5ff', letterSpacing: '0.28em' }}
          >
            DEPLOYMENT PROTOCOLS
          </p>
        </div>

        {/* 3×3 on desktop, 1-col on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-8">
          {features.map((f) => (
            <div key={f.name}>
              <div className="mb-2" style={{ color: '#00e5ff' }}>
                {f.icon}
              </div>
              <h3
                className="text-white text-xs font-bold mb-1"
                style={{ letterSpacing: '0.12em' }}
              >
                {f.name.toUpperCase()}
              </h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
