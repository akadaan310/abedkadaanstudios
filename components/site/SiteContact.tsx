import { SiteHours } from './SiteHours';

interface Props {
  phone: string | null;
  address: { street: string; city: string; state: string; zip: string } | null;
  hours: Record<string, string> | null;
}

export function SiteContact({ phone, address, hours }: Props) {
  const mapSrc = address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(
        `${address.street} ${address.city} ${address.state} ${address.zip}`
      )}&output=embed`
    : null;

  return (
    <section id="contact" className="bg-[var(--color-secondary)] py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">

        {/* Header */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-[var(--color-accent)]" />
            <span className="text-[var(--color-accent)] text-xs font-semibold uppercase tracking-[0.2em]">
              Find Us
            </span>
          </div>
          <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-text)] leading-tight tracking-tight">
            Contact & Hours
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* Left — details (2 cols) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-text-light)]/10 shadow-sm p-6 space-y-8">
              {/* Address */}
              {address && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-light)] mb-3">Address</p>
                  <div className="flex gap-3">
                    <MapPinIcon />
                    <div>
                      <p className="text-[var(--color-text)] text-sm font-medium">{address.street}</p>
                      <p className="text-[var(--color-text-light)] text-sm">{address.city}, {address.state} {address.zip}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Phone */}
              {phone && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-light)] mb-3">Phone</p>
                  <a
                    href={`tel:${phone.replace(/\D/g, '')}`}
                    className="flex items-center gap-3 text-[var(--color-accent)] font-semibold hover:opacity-80 transition-opacity"
                  >
                    <PhoneIcon />
                    <span className="text-sm">{phone}</span>
                  </a>
                </div>
              )}

              {/* Hours */}
              {hours && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-light)] mb-1">Hours</p>
                  <SiteHours hours={hours} />
                </div>
              )}
            </div>
          </div>

          {/* Right — map (3 cols) */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden min-h-[380px] border border-[var(--color-text-light)]/10">
            {mapSrc ? (
              <iframe
                src={mapSrc}
                title="Business location map"
                className="w-full h-full min-h-[380px] border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="w-full h-full min-h-[380px] bg-[var(--color-surface)] flex items-center justify-center text-sm text-[var(--color-text-light)]">
                Address not available
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MapPinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-accent)] mt-0.5 flex-shrink-0" aria-hidden="true">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.06 6.06l.98-.98a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z" />
    </svg>
  );
}
