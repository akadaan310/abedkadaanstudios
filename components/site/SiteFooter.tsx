interface Props {
  name: string;
  phone: string | null;
  subheadline: string;
  address: { street: string; city: string; state: string; zip: string } | null;
}

export function SiteFooter({ name, phone, subheadline, address }: Props) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-text)]">
      {/* Main footer body */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/10">

          {/* Brand column */}
          <div className="md:col-span-1">
            <p className="font-[var(--font-display)] text-2xl font-bold text-white mb-3 tracking-tight">
              {name}
            </p>
            <p className="text-white/50 text-sm leading-relaxed max-w-xs">
              {subheadline}
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-5">Quick Links</p>
            <ul className="space-y-3">
              {['Services', 'Gallery', 'Reviews', 'About', 'Contact'].map((link) => (
                <li key={link}>
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-white/60 text-sm hover:text-white transition-colors duration-200"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-5">Contact</p>
            <div className="space-y-3">
              {phone && (
                <a
                  href={`tel:${phone.replace(/\D/g, '')}`}
                  className="flex items-center gap-2.5 text-white/60 text-sm hover:text-white transition-colors duration-200"
                >
                  <PhoneIcon />
                  {phone}
                </a>
              )}
              {address && (
                <p className="text-white/50 text-sm leading-relaxed">
                  {address.street}<br />
                  {address.city}, {address.state} {address.zip}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/25 text-xs">
            &copy; {year} {name}. All rights reserved.
          </p>
          <p className="text-white/20 text-xs">
            Designed &amp; Built for Local Excellence
          </p>
        </div>
      </div>
    </footer>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z" />
    </svg>
  );
}
