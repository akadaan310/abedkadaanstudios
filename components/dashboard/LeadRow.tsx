'use client';

import { useState } from 'react';
import type { Lead } from '@/types/lead';
import type { LeadStatus } from '@/types/dashboard';

const ALL_STATUSES: LeadStatus[] = ['new', 'not_answered', 'not_interested', 'emailed', 'prepared', 'purchased'];

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  not_answered: 'Not Answered',
  not_interested: 'Not Interested',
  emailed: 'Emailed',
  prepared: 'Prepared',
  purchased: 'Purchased',
};

const STATUS_STYLES: Record<LeadStatus, string> = {
  new: 'bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30',
  not_answered: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
  not_interested: 'bg-neutral-700/50 text-neutral-400 ring-1 ring-neutral-600/50',
  emailed: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
  prepared: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30',
  purchased: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
};

const STATUS_DROPDOWN_HOVER: Record<LeadStatus, string> = {
  new: 'hover:bg-blue-500/10',
  not_answered: 'hover:bg-violet-500/10',
  not_interested: 'hover:bg-neutral-700/50',
  emailed: 'hover:bg-amber-500/10',
  prepared: 'hover:bg-cyan-500/10',
  purchased: 'hover:bg-emerald-500/10',
};

const SCORE_CONFIG: Record<string, { label: string; styles: string }> = {
  hot: { label: 'Hot', styles: 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30' },
  warm: { label: 'Warm', styles: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30' },
  cold: { label: 'Cold', styles: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30' },
};

const SCORE_DOT: Record<string, string> = {
  hot: 'bg-rose-400',
  warm: 'bg-amber-400',
  cold: 'bg-sky-400',
};

async function patchLead(id: string, body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`/api/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.error(`PATCH /api/leads/${id} failed (${res.status}):`, text);
    throw new Error(`PATCH failed (${res.status}): ${text}`);
  }
}

interface Props {
  lead: Lead;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (id: string, updated: Partial<Lead>) => void;
}

export function LeadRow({ lead, selected, onSelect, onUpdate }: Props) {
  const [statusOpen, setStatusOpen] = useState(false);

  async function handleStatusSelect(next: LeadStatus) {
    setStatusOpen(false);
    const prev = lead.status;
    onUpdate(lead.id, { status: next });
    try {
      await patchLead(lead.id, { status: next });
    } catch {
      onUpdate(lead.id, { status: prev });
    }
  }

  const scoreConf = lead.score_label ? SCORE_CONFIG[lead.score_label] : null;

  return (
    <tr
      onClick={onSelect}
      className={`border-b border-neutral-800/60 cursor-pointer transition-colors ${
        selected ? 'bg-neutral-800/60' : 'hover:bg-neutral-800/30'
      }`}
    >
      {/* Score */}
      <td className="px-4 py-3 whitespace-nowrap">
        {scoreConf ? (
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${scoreConf.styles}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${SCORE_DOT[lead.score_label!]}`} />
            {scoreConf.label}
          </span>
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </td>

      {/* Business name */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm font-semibold text-white">{lead.name ?? '—'}</span>
      </td>

      {/* Category */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm text-neutral-400">{lead.category ?? '—'}</span>
      </td>

      {/* Phone */}
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        {lead.phone ? (
          <a
            href={`tel:${lead.phone}`}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            {lead.phone}
          </a>
        ) : (
          <span className="text-neutral-600">—</span>
        )}
      </td>

      {/* Location */}
      <td className="px-4 py-3 whitespace-nowrap">
        <span className="text-sm text-neutral-400">
          {lead.address ? `${lead.address.city}, ${lead.address.state}` : '—'}
        </span>
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
        <div className="relative inline-block">
          <button
            onClick={() => setStatusOpen((o) => !o)}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer transition-opacity hover:opacity-80 ${STATUS_STYLES[lead.status]}`}
          >
            {STATUS_LABELS[lead.status]}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="opacity-60">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {statusOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
              <div className="absolute left-0 top-full mt-1.5 z-20 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden min-w-[160px]">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleStatusSelect(s)}
                    className={`flex items-center gap-2 w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                      s === lead.status ? 'opacity-40 cursor-default' : STATUS_DROPDOWN_HOVER[s]
                    } ${STATUS_STYLES[s].split(' ').filter((c) => c.startsWith('text-')).join(' ')}`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
