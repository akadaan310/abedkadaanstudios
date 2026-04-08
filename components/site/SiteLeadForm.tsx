'use client';

import { useState } from 'react';

interface Props {
  cta: string;
  businessId: string;
}

export function SiteLeadForm({ cta, businessId }: Props) {
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/leads/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, firstName, phone, message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? 'Something went wrong. Please try again.');
      }

      setSuccess(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="lead-form" className="bg-[var(--color-primary)] py-28 relative overflow-hidden">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — copy */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-white/40" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-[0.2em]">
                Get In Touch
              </span>
            </div>

            <h2 className="font-[var(--font-display)] text-4xl sm:text-5xl font-bold text-white leading-tight tracking-tight mb-6">
              {cta}
            </h2>

            <p className="text-white/60 text-[15px] leading-relaxed mb-10">
              Fill out the form and we&apos;ll get back to you within the hour. No obligation, no pressure.
            </p>

            {/* Trust points */}
            <div className="space-y-4">
              {[
                { icon: '⚡', text: 'Quick response' },
                { icon: '🔒', text: 'Your information stays private' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-3 text-white/70 text-sm">
                  <span className="text-base">{icon}</span>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 lg:p-10">
            {success ? (
              <div className="py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center mx-auto mb-5">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-white text-xl font-semibold mb-2">Message received!</p>
                <p className="text-white/60 text-sm">We&apos;ll be in touch shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label htmlFor="firstName" className="block text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Your first name"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                    Message <span className="normal-case opacity-50 font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you need..."
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-white/50 focus:bg-white/15 transition-all duration-200 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-[var(--color-primary)] font-semibold rounded-xl py-4 text-sm hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 mt-2 tracking-wide"
                >
                  {loading ? 'Sending…' : 'Send Message →'}
                </button>

                {error && (
                  <p className="text-center text-sm text-white/70 bg-white/10 rounded-lg py-3 px-4">
                    {error}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
