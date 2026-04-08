interface Props {
  services: Array<{ name: string; icon: string; description: string }>;
}

export function SiteServices({ services }: Props) {
  if (!services?.length) return null;

  return (
    <section id="services" className="bg-[var(--color-background)] py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-[var(--color-accent)]" />
              <span className="text-[var(--color-accent)] text-xs font-semibold uppercase tracking-[0.2em]">
                What We Do
              </span>
            </div>
            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-[var(--color-text)] leading-tight tracking-tight">
              Our Services
            </h2>
          </div>
          <p className="text-[var(--color-text-light)] max-w-sm text-[15px] leading-relaxed md:text-right">
            Professional solutions delivered with precision — every job, every time.
          </p>
        </div>

        {/* Service cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[var(--color-text-light)]/10 rounded-2xl overflow-hidden border border-[var(--color-text-light)]/10">
          {services.map((service, i) => (
            <div
              key={service.name}
              className="bg-[var(--color-background)] p-8 group hover:bg-[var(--color-surface)] transition-colors duration-300 relative"
            >
              {/* Number */}
              <span className="absolute top-7 right-7 font-[var(--font-display)] text-5xl font-bold text-[var(--color-text-light)]/10 leading-none select-none">
                {String(i + 1).padStart(2, '0')}
              </span>

              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center mb-6 group-hover:bg-[var(--color-accent)]/20 transition-colors duration-300">
                <span className="text-2xl" role="img" aria-hidden="true">{service.icon}</span>
              </div>

              {/* Content */}
              <h3 className="font-semibold text-[var(--color-text)] text-lg mb-2 tracking-tight">
                {service.name}
              </h3>
              <p className="text-[var(--color-text-light)] text-sm leading-relaxed">
                {service.description}
              </p>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-8 w-0 h-0.5 bg-[var(--color-accent)] group-hover:w-12 transition-all duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
