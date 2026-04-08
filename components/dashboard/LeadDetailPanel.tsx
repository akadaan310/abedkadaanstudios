'use client';

import { useRef, useState } from 'react';
import type { Lead } from '@/types/lead';

async function patchLead(id: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH failed (${res.status})`);
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

interface Props {
  lead: Lead;
  onClose: () => void;
  onPrepareSite: (leadId: string) => void;
  onUpdate: (id: string, updated: Partial<Lead>) => void;
}

export function LeadDetailPanel({ lead, onClose, onPrepareSite, onUpdate }: Props) {
  const [copied, setCopied] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);
  const domainRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'abedkadaan.com';
  const siteUrl = lead.business_slug ? `https://${lead.business_slug}.${appDomain}` : null;

  async function handleEmailBlur() {
    const next = emailRef.current?.value.trim() ?? '';
    const prev = lead.contact_email ?? '';
    if (next === prev) return;
    onUpdate(lead.id, { contact_email: next || null });
    try {
      await patchLead(lead.id, { contact_email: next || null });
    } catch {
      onUpdate(lead.id, { contact_email: prev || null });
    }
  }

  async function handleNotesBlur() {
    const next = notesRef.current?.value ?? '';
    const prev = lead.notes ?? '';
    if (next === prev) return;
    onUpdate(lead.id, { notes: next || null });
    try {
      await patchLead(lead.id, { notes: next || null });
    } catch {
      onUpdate(lead.id, { notes: prev || null });
    }
  }

  async function handleDomainBlur() {
    const next = domainRef.current?.value.trim() ?? '';
    const prev = lead.purchased_domain ?? '';
    if (next === prev) return;
    onUpdate(lead.id, { purchased_domain: next || null });
    try {
      await patchLead(lead.id, { purchased_domain: next || null });
    } catch {
      onUpdate(lead.id, { purchased_domain: prev || null });
    }
  }

  async function handleCopy() {
    if (!siteUrl) return;
    await navigator.clipboard.writeText(siteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between px-4 py-4 border-b border-neutral-800 flex-shrink-0">
        <div className="flex-1 min-w-0 pr-3">
          <h2 className="text-sm font-semibold text-white leading-snug">{lead.name ?? '—'}</h2>
          {lead.category && (
            <p className="text-xs text-neutral-500 mt-0.5 truncate">{lead.category}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Close panel"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">

        {/* Action */}
        <button
          onClick={() => onPrepareSite(lead.id)}
          disabled={lead.status !== 'new'}
          className="w-full text-sm font-semibold px-4 py-2 rounded-lg bg-white text-neutral-950 hover:bg-neutral-100 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          Prepare Site →
        </button>

        {/* Reviews & Images */}
        <div className="flex gap-6">
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Reviews</p>
            <div className="flex items-center gap-1.5">
              {lead.rating !== null && (
                <span className="text-sm text-amber-400 font-medium">★ {lead.rating}</span>
              )}
              <span className="text-sm text-neutral-400">({lead.review_count})</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Photos</p>
            <span className="text-sm text-neutral-400">{lead.image_count}</span>
          </div>
        </div>

        {/* Site URL */}
        {siteUrl && (
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Site URL</p>
            <div className="flex items-center gap-1.5">
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors truncate flex-1"
              >
                {siteUrl}
              </a>
              <button
                onClick={handleCopy}
                title="Copy URL"
                className="flex-shrink-0 text-neutral-600 hover:text-neutral-300 transition-colors"
              >
                {copied ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-400">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Purchased Domain */}
        <div>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Purchased Domain</p>
          <input
            ref={domainRef}
            defaultValue={lead.purchased_domain ?? ''}
            onBlur={handleDomainBlur}
            placeholder="domain.com"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>

        {/* Contact Email */}
        <div>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Contact Email</p>
          <input
            ref={emailRef}
            type="email"
            defaultValue={lead.contact_email ?? ''}
            onBlur={handleEmailBlur}
            placeholder="owner@business.com"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
          />
          <p className="text-[11px] text-neutral-600 mt-1">Lead form submissions are forwarded here.</p>
        </div>

        {/* Notes */}
        <div>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Notes</p>
          <textarea
            ref={notesRef}
            defaultValue={lead.notes ?? ''}
            onBlur={handleNotesBlur}
            rows={4}
            placeholder="Add notes…"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 resize-none focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>

        {/* Full address */}
        {lead.address && (
          <div>
            <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Address</p>
            {lead.address.street && (
              <p className="text-sm text-neutral-400">{lead.address.street}</p>
            )}
            <p className="text-sm text-neutral-400">
              {lead.address.city}, {lead.address.state} {lead.address.zip}
            </p>
          </div>
        )}

        {/* Google Maps */}
        {lead.google_maps_url && (
          <a
            href={lead.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            View on Google Maps
          </a>
        )}

        {/* Discovered */}
        <div>
          <p className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mb-1">Discovered</p>
          <p className="text-sm text-neutral-500">{relativeTime(lead.discovered_at)}</p>
        </div>
      </div>
    </div>
  );
}
