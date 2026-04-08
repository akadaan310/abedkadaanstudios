'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { IngestPanel } from '@/components/dashboard/IngestPanel';
import { LeadDetailPanel } from '@/components/dashboard/LeadDetailPanel';
import { LeadRow } from '@/components/dashboard/LeadRow';
import { PrepareWizard } from '@/components/dashboard/PrepareWizard';
import type { Lead } from '@/types/lead';
import type { ScoreLabel, LeadStatus } from '@/types/dashboard';

type ScoreFilter = 'all' | ScoreLabel;
type StatusFilter = 'all' | LeadStatus;
type SortKey = 'score' | 'discovered' | 'reviews' | 'name';

const SCORE_ORDER: Record<string, number> = { hot: 0, warm: 1, cold: 2 };

function scoreSort(a: Lead, b: Lead): number {
  const sa = a.score_label ? (SCORE_ORDER[a.score_label] ?? 3) : 3;
  const sb = b.score_label ? (SCORE_ORDER[b.score_label] ?? 3) : 3;
  if (sa !== sb) return sa - sb;
  return new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime();
}

function sortLeads(leads: Lead[], key: SortKey): Lead[] {
  const copy = [...leads];
  switch (key) {
    case 'score':
      return copy.sort(scoreSort);
    case 'discovered':
      return copy.sort((a, b) => new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime());
    case 'reviews':
      return copy.sort((a, b) => b.review_count - a.review_count);
    case 'name':
      return copy.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  }
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [scoreFilter, setScoreFilter] = useState<ScoreFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [nameSearch, setNameSearch] = useState('');
  const [nameSearchDebounced, setNameSearchDebounced] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('score');

  const [wizardLeadId, setWizardLeadId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setNameSearchDebounced(nameSearch), 300);
    return () => clearTimeout(t);
  }, [nameSearch]);

  const fetchLeads = useCallback(async () => {
    setFetchError(null);
    const res = await fetch('/api/leads');
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as Record<string, unknown>;
      const msg = typeof body.error === 'string' ? body.error : `HTTP ${res.status}`;
      setFetchError(msg);
      setLoading(false);
      return;
    }
    const data = (await res.json()) as Array<Record<string, unknown>>;
    const mapped: Lead[] = data.map((row) => {
      const businessesArr = Array.isArray(row.businesses)
        ? (row.businesses as Array<{ slug: string }>)
        : row.businesses
        ? [row.businesses as { slug: string }]
        : [];
      const { businesses: _b, ...rest } = row;
      void _b;
      return { ...(rest as Lead), business_slug: businessesArr[0]?.slug ?? undefined };
    });
    setLeads(mapped);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function handleUpdate(id: string, updated: Partial<Lead>) {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updated } : l)));
  }

  function updateLeadStatus(id: string, status: LeadStatus) {
    handleUpdate(id, { status });
  }

  const filtered = useMemo(() => {
    let result = leads;
    if (scoreFilter !== 'all') result = result.filter((l) => l.score_label === scoreFilter);
    if (statusFilter !== 'all') result = result.filter((l) => l.status === statusFilter);
    if (nameSearchDebounced.trim()) {
      const q = nameSearchDebounced.trim().toLowerCase();
      result = result.filter((l) => l.name?.toLowerCase().includes(q));
    }
    return sortLeads(result, sortKey);
  }, [leads, scoreFilter, statusFilter, nameSearchDebounced, sortKey]);

  const stats = useMemo(() => ({
    total: leads.length,
    hot: leads.filter((l) => l.score_label === 'hot').length,
    warm: leads.filter((l) => l.score_label === 'warm').length,
    emailed: leads.filter((l) => l.status === 'emailed').length,
    purchased: leads.filter((l) => l.status === 'purchased').length,
  }), [leads]);

  return (
    <div className="flex h-screen overflow-hidden bg-neutral-950 text-white">

      {/* ── Sidebar ── */}
      <aside
        className={`flex-shrink-0 flex flex-col bg-neutral-900 border-r border-neutral-800 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72' : 'w-12'
        }`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-3 py-4 border-b border-neutral-800 min-h-[57px]">
          {sidebarOpen && (
            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">
              Import Leads
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="w-6 h-6 flex items-center justify-center rounded-md text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors ml-auto"
            aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>

        {/* Sidebar body */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-4">
            <IngestPanel onImportComplete={fetchLeads} />
          </div>
        )}
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950">
          <h1 className="text-lg font-semibold text-white tracking-tight">Dashboard</h1>

          {/* Stats */}
          <div className="flex items-center gap-1">
            {[
              { label: 'Total', value: stats.total, color: 'text-white' },
              { label: 'Hot', value: stats.hot, color: 'text-rose-400' },
              { label: 'Warm', value: stats.warm, color: 'text-amber-400' },
              { label: 'Emailed', value: stats.emailed, color: 'text-blue-400' },
              { label: 'Purchased', value: stats.purchased, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="flex flex-col items-center px-4 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 min-w-[64px]"
              >
                <span className={`text-base font-bold tabular-nums ${color}`}>{value}</span>
                <span className="text-[11px] text-neutral-500 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </header>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-6 py-3 border-b border-neutral-800 bg-neutral-950">
          {/* Score filters */}
          <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
            {(['all', 'hot', 'warm', 'cold'] as ScoreFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setScoreFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  scoreFilter === s
                    ? 'bg-white text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s === 'all' ? 'All scores' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
            {(['all', 'new', 'not_answered', 'not_interested', 'emailed', 'purchased'] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  statusFilter === s
                    ? 'bg-white text-neutral-950'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {s === 'all' ? 'All statuses' : s === 'not_answered' ? 'Not Answered' : s === 'not_interested' ? 'Not Interested' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={nameSearch}
              onChange={(e) => setNameSearch(e.target.value)}
              placeholder="Search by name…"
              className="pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors w-48"
            />
          </div>

          {/* Sort */}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-sm text-neutral-300 focus:outline-none focus:border-neutral-600 transition-colors ml-auto"
          >
            <option value="score">Sort: Score</option>
            <option value="discovered">Sort: Discovery Date</option>
            <option value="reviews">Sort: Review Count</option>
            <option value="name">Sort: Name A–Z</option>
          </select>

          <span className="text-xs text-neutral-600 whitespace-nowrap">
            {filtered.length} of {leads.length}
          </span>
        </div>

        {/* Table + Detail Panel area */}
        <div className="flex-1 flex overflow-hidden">

          {/* Table */}
          <div className="flex-1 overflow-auto">
            {fetchError && (
              <div className="mx-6 mt-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                Failed to load leads: {fetchError}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="flex items-center gap-2 text-neutral-500 text-sm">
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Loading leads…
                </div>
              </div>
            ) : leads.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 gap-2">
                <p className="text-neutral-500 text-sm">No leads yet.</p>
                <p className="text-neutral-600 text-xs">Use the Import panel on the left to pull your first batch.</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/50">
                    {['Score', 'Business', 'Category', 'Phone', 'Location', 'Status'].map((col) => (
                      <th
                        key={col}
                        className="px-4 py-3 text-left text-[11px] font-semibold text-neutral-500 uppercase tracking-wider whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((lead) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      selected={selectedLeadId === lead.id}
                      onSelect={() => setSelectedLeadId((prev) => (prev === lead.id ? null : lead.id))}
                      onUpdate={handleUpdate}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail panel */}
          {selectedLeadId && (() => {
            const selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null;
            if (!selectedLead) return null;
            return (
              <div className="w-80 flex-shrink-0 border-l border-neutral-800 bg-neutral-900 overflow-hidden flex flex-col">
                <LeadDetailPanel
                  lead={selectedLead}
                  onClose={() => setSelectedLeadId(null)}
                  onPrepareSite={(id) => setWizardLeadId(id)}
                  onUpdate={handleUpdate}
                />
              </div>
            );
          })()}
        </div>
      </div>

      {/* Wizard */}
      {wizardLeadId && (() => {
        const wizardLead = leads.find((l) => l.id === wizardLeadId) ?? null;
        return (
          <PrepareWizard
            leadId={wizardLeadId}
            leadName={wizardLead?.name ?? null}
            leadAddress={wizardLead?.address ?? null}
            leadPhone={wizardLead?.phone ?? null}
            onClose={() => setWizardLeadId(null)}
            onComplete={() => {
              setWizardLeadId(null);
              fetchLeads();
            }}
          />
        );
      })()}
    </div>
  );
}
