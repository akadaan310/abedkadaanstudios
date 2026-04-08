'use client';

import { useEffect, useState } from 'react';

const HISTORY_KEY = 'ingest_history';
const MAX_HISTORY = 50;

interface HistoryEntry {
  location: string;
  category: string;
  importedAt: string; // ISO string
}

function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry[];
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch {
    // storage unavailable — ignore
  }
}

function upsertEntry(entries: HistoryEntry[], location: string, category: string): HistoryEntry[] {
  const normalized = { location: location.trim(), category };
  const filtered = entries.filter(
    (e) => !(e.location === normalized.location && e.category === normalized.category)
  );
  return [{ ...normalized, importedAt: new Date().toISOString() }, ...filtered];
}

const CATEGORIES = [
  'Accountant',
  'Auto Repair Shop',
  'Bakery',
  'Barber Shop',
  'Carpet Cleaning Service',
  'Catering Service',
  'Cleaning Service',
  'Dental Clinic',
  'Electrician',
  'Florist',
  'General Contractor',
  'Hair Salon',
  'HVAC Contractor',
  'Insurance Agency',
  'Landscaping Service',
  'Law Firm',
  'Locksmith',
  'Moving Company',
  'Nail Salon',
  'Painter',
  'Pest Control Service',
  'Pet Groomer',
  'Photography Studio',
  'Plumber',
  'Pool Service',
  'Real Estate Agency',
  'Roofing Contractor',
  'Tattoo Shop',
  'Tree Service',
  'Veterinarian',
] as const;

interface IngestResult {
  totalScraped: number;
  inserted: number;
  skipped: number;
}

type StatusLine =
  | { kind: 'scraping' }
  | { kind: 'done'; result: IngestResult }
  | { kind: 'error'; message: string };

interface Props {
  onImportComplete: () => void;
}

export function IngestPanel({ onImportComplete }: Props) {
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [targetLeads, setTargetLeads] = useState('');
  const [status, setStatus] = useState<StatusLine | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const conversionRate = 0.40;
  const targetLeadsNum = parseInt(targetLeads, 10) || 0;
  const scrapeCount = targetLeadsNum > 0 ? Math.ceil(targetLeadsNum / conversionRate) : 0;
  const cost = (0.007 + 0.005 * scrapeCount).toFixed(2);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location.trim()) return;

    setLoading(true);
    setStatus({ kind: 'scraping' });

    try {
      const res = await fetch('/api/leads/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location.trim(),
          category,
          targetLeads: targetLeadsNum,
          conversionEstimate: conversionRate,
        }),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const message =
          typeof data === 'object' && data !== null && 'error' in data && typeof (data as Record<string, unknown>).error === 'string'
            ? (data as Record<string, string>).error
            : `Request failed (${res.status})`;
        setStatus({ kind: 'error', message });
        return;
      }

      if (
        typeof data !== 'object' ||
        data === null ||
        !('totalScraped' in data) ||
        !('inserted' in data) ||
        !('skipped' in data)
      ) {
        setStatus({ kind: 'error', message: 'Unexpected response shape from server.' });
        return;
      }

      const result = data as IngestResult;
      setStatus({ kind: 'done', result });

      const updated = upsertEntry(history, location, category);
      setHistory(updated);
      saveHistory(updated);

      onImportComplete();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setStatus({ kind: 'error', message });
    } finally {
      setLoading(false);
    }
  }

  function renderStatus() {
    if (!status) return null;

    if (status.kind === 'error') {
      return (
        <div className="mt-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
          <p className="text-xs text-red-400">{status.message}</p>
        </div>
      );
    }

    const lines: string[] = [];
    if (status.kind === 'scraping') {
      lines.push('⏳ Scraping...');
    } else if (status.kind === 'done') {
      lines.push(`✓ ${status.result.totalScraped} places returned`);
      lines.push(`✓ ${status.result.inserted} new leads inserted`);
      lines.push(`↩ ${status.result.skipped} skipped (already in DB)`);
    }

    return (
      <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 space-y-1">
        {lines.map((line, i) => (
          <p key={i} className="text-xs text-emerald-400 font-mono">{line}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="ingest-location">
            Location
          </label>
          <input
            id="ingest-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Tampa, FL or 33601"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="ingest-category">
            Category
          </label>
          <select
            id="ingest-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neutral-500 transition-colors"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5" htmlFor="ingest-target">
            Target leads
          </label>
          <input
            id="ingest-target"
            type="text"
            inputMode="numeric"
            value={targetLeads}
            onChange={(e) => setTargetLeads(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 400"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-colors"
          />
        </div>

        <div className="rounded-lg bg-neutral-800/50 border border-neutral-700/50 px-3 py-2.5 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Places to scrape</span>
            <span className="text-neutral-200 font-medium">~{scrapeCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-neutral-500">Apify cost est.</span>
            <span className="text-neutral-200 font-medium">~${cost}</span>
          </div>
          <p className="text-[11px] text-neutral-600 pt-0.5">~40% conversion rate assumed</p>
        </div>

        <button
          type="submit"
          disabled={loading || !location.trim() || targetLeadsNum < 1}
          className="w-full bg-white text-neutral-950 text-sm font-semibold rounded-lg px-4 py-2.5 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Importing…' : 'Begin Import →'}
        </button>
      </form>

      {renderStatus()}

      {history.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-widest">
              Import History
            </span>
            <button
              type="button"
              onClick={() => { setHistory([]); saveHistory([]); }}
              className="text-[10px] text-neutral-600 hover:text-neutral-400 transition-colors"
            >
              Clear
            </button>
          </div>
          <ul className="space-y-1.5">
            {history.map((entry, i) => {
              const isDuplicate =
                entry.location === location.trim() && entry.category === category;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => {
                      setLocation(entry.location);
                      setCategory(entry.category as typeof category);
                    }}
                    className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                      isDuplicate
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-neutral-800 bg-neutral-800/30 hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{entry.location}</p>
                        <p className="text-[11px] text-neutral-500 truncate">{entry.category}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        {isDuplicate && (
                          <span className="block text-[10px] font-medium text-amber-400 mb-0.5">
                            duplicate
                          </span>
                        )}
                        <span className="block text-[10px] text-neutral-600">
                          {new Date(entry.importedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
