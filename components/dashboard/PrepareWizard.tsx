'use client';

import { useEffect, useState } from 'react';
import type { BusinessCopy, ColorSystem } from '@/types/business';
import type { Review } from '@/types/lead';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type WizardView = 'step1' | 'step2a' | 'step2b' | 'step3';
type Step1Phase = 'idle' | 'fetching_reviews' | 'reviews_ready' | 'generating_copy' | 'copy_ready';
type Step2Phase = 'idle' | 'fetching_images' | 'ready';
type Step3Phase = 'idle' | 'generating_colors' | 'colors_ready';
type LLMProvider = 'anthropic' | 'gemini';
type ImageProvider = 'gemini';

interface FinalizeResponse {
  siteUrl: string;
}

const COLOR_LABELS: Array<{ key: keyof ColorSystem; label: string }> = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'background', label: 'BG' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'textLight', label: 'Muted' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDarkColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

async function postJSON<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data: unknown = await res.json();
  if (!res.ok) {
    const msg =
      typeof data === 'object' && data !== null && 'error' in data && typeof (data as Record<string, unknown>).error === 'string'
        ? (data as Record<string, string>).error
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LLMSelector({ value, onChange }: { value: LLMProvider; onChange: (v: LLMProvider) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LLMProvider)}
      className="text-xs bg-zinc-100 border border-zinc-300 rounded-lg px-2.5 py-1.5 text-zinc-700 focus:outline-none focus:border-zinc-400 cursor-pointer"
    >
      <option value="anthropic">Anthropic Claude</option>
      <option value="gemini">Google Gemini</option>
    </select>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin text-zinc-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
      <p className="text-sm font-medium text-red-700">Error</p>
      <p className="text-sm text-red-600 mt-0.5">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm font-semibold text-red-700 underline underline-offset-2">
          Retry
        </button>
      )}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const stars = Math.min(5, Math.max(1, review.stars));
  return (
    <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-zinc-800">{review.reviewer}</span>
        <div className="flex items-center gap-0.5">
          {Array.from({ length: stars }).map((_, i) => (
            <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-4">{review.text}</p>
      <p className="text-[11px] text-zinc-400">{review.date}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  leadId: string;
  leadName: string | null;
  leadAddress: { street: string; city: string; state: string; zip: string } | null;
  leadPhone: string | null;
  onClose: () => void;
  onComplete: (siteUrl: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrepareWizard({ leadId, leadName, leadAddress, leadPhone, onClose, onComplete }: Props) {
  const [currentView, setCurrentView] = useState<WizardView>('step1');

  // Step 1 state
  const [step1Phase, setStep1Phase] = useState<Step1Phase>('idle');
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [copy, setCopy] = useState<BusinessCopy | null>(null);
  const [copyProvider, setCopyProvider] = useState<LLMProvider>('anthropic');

  // Step 2 state
  const [step2Phase, setStep2Phase] = useState<Step2Phase>('idle');
  const [step2Error, setStep2Error] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [aiHeroImageUrls, setAiHeroImageUrls] = useState<string[]>([]);
  const [aiGalleryImageUrls, setAiGalleryImageUrls] = useState<string[]>([]);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const imageProvider: ImageProvider = 'gemini';
  const [hideGallery, setHideGallery] = useState(false);
  const [heroImagePrompt, setHeroImagePrompt] = useState<string | null>(null);
  const [galleryImagePrompt, setGalleryImagePrompt] = useState<string | null>(null);
  const [aiHeroCount, setAiHeroCount] = useState(1);
  const [aiGalleryCount, setAiGalleryCount] = useState(6);
  const [aiHeroLoading, setAiHeroLoading] = useState(false);
  const [aiGalleryLoading, setAiGalleryLoading] = useState(false);
  const [aiHeroError, setAiHeroError] = useState<string | null>(null);
  const [aiGalleryError, setAiGalleryError] = useState<string | null>(null);

  // Unsplash state
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<string[]>([]);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [unsplashTotalPages, setUnsplashTotalPages] = useState(0);
  const [unsplashSearchLoading, setUnsplashSearchLoading] = useState(false);
  const [unsplashQueryLoading, setUnsplashQueryLoading] = useState(false);
  const [unsplashError, setUnsplashError] = useState<string | null>(null);

  // Step 3 state
  const [step3Phase, setStep3Phase] = useState<Step3Phase>('idle');
  const [step3Error, setStep3Error] = useState<string | null>(null);
  const [colorProvider, setColorProvider] = useState<LLMProvider>('anthropic');
  const [colorSystem, setColorSystem] = useState<ColorSystem | null>(null);
  const [finalizeResult, setFinalizeResult] = useState<FinalizeResponse | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // ---------------------------------------------------------------------------
  // Close guard
  // ---------------------------------------------------------------------------

  const isRunning =
    step1Phase === 'fetching_reviews' ||
    step1Phase === 'generating_copy' ||
    step2Phase === 'fetching_images' ||
    aiHeroLoading ||
    aiGalleryLoading ||
    unsplashSearchLoading ||
    unsplashQueryLoading ||
    step3Phase === 'generating_colors';

  const isAIFallback = aiHeroImageUrls.length > 0 || aiGalleryImageUrls.length > 0;

  function handleClose() {
    if (isRunning && !confirm('Are you sure? Progress will be lost.')) return;
    onClose();
  }

  // ---------------------------------------------------------------------------
  // Step 1 — Fetch reviews
  // ---------------------------------------------------------------------------

  async function handleFetchReviews() {
    setStep1Phase('fetching_reviews');
    setStep1Error(null);
    try {
      const data = await postJSON<{ reviews: Review[] }>('/api/prepare-site/fetch-reviews', { leadId });
      setReviews(data.reviews);
      setStep1Phase('reviews_ready');
    } catch (err) {
      setStep1Error(err instanceof Error ? err.message : 'Unknown error');
      setStep1Phase('idle');
    }
  }

  // ---------------------------------------------------------------------------
  // Step 1 — Generate copy
  // ---------------------------------------------------------------------------

  async function handleGenerateCopy() {
    setStep1Phase('generating_copy');
    setStep1Error(null);
    try {
      const data = await postJSON<{ copy: BusinessCopy }>('/api/prepare-site/generate-copy', {
        leadId,
        provider: copyProvider,
      });
      setCopy(data.copy);
      setHeroImagePrompt(data.copy.hero_image_prompt ?? null);
      setGalleryImagePrompt(data.copy.gallery_image_prompt ?? null);
      setStep1Phase('copy_ready');
    } catch (err) {
      setStep1Error(err instanceof Error ? err.message : 'Unknown error');
      setStep1Phase('reviews_ready');
    }
  }

  // Auto-fetch images when entering step 2a
  useEffect(() => {
    if (currentView === 'step2a' && step2Phase === 'idle') {
      handleFetchImages();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView]);

  // ---------------------------------------------------------------------------
  // Step 2 — Fetch images
  // ---------------------------------------------------------------------------

  async function handleFetchImages() {
    setStep2Phase('fetching_images');
    setStep2Error(null);
    try {
      const data = await postJSON<{ imageUrls: string[] }>('/api/prepare-site/fetch-images', { leadId });
      setImageUrls(data.imageUrls);
      setStep2Phase('ready');
    } catch (err) {
      setStep2Error(err instanceof Error ? err.message : 'Unknown error');
      setStep2Phase('idle');
    }
  }

  // ---------------------------------------------------------------------------
  // Step 2 — Generate AI images
  // ---------------------------------------------------------------------------

  async function handleGenerateHeroImages() {
    setAiHeroLoading(true);
    setAiHeroError(null);
    try {
      const data = await postJSON<{ urls: string[] }>('/api/prepare-site/generate-images', {
        leadId,
        provider: imageProvider,
        count: aiHeroCount,
        purpose: 'hero',
        customPrompt: heroImagePrompt ?? undefined,
      });
      setAiHeroImageUrls((prev) => [...prev, ...data.urls]);
    } catch (err) {
      setAiHeroError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAiHeroLoading(false);
    }
  }

  async function handleGenerateGalleryImages() {
    setAiGalleryLoading(true);
    setAiGalleryError(null);
    try {
      const data = await postJSON<{ urls: string[] }>('/api/prepare-site/generate-images', {
        leadId,
        provider: imageProvider,
        count: aiGalleryCount,
        purpose: 'gallery',
        customPrompt: galleryImagePrompt ?? undefined,
      });
      setAiGalleryImageUrls((prev) => [...prev, ...data.urls]);
    } catch (err) {
      setAiGalleryError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAiGalleryLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Unsplash — Generate query + search
  // ---------------------------------------------------------------------------

  async function handleGenerateUnsplashQuery() {
    setUnsplashQueryLoading(true);
    setUnsplashError(null);
    try {
      const data = await postJSON<{ query: string }>('/api/prepare-site/generate-unsplash-query', { leadId });
      setUnsplashQuery(data.query);
    } catch (err) {
      setUnsplashError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUnsplashQueryLoading(false);
    }
  }

  async function handleSearchUnsplash(page: number) {
    if (!unsplashQuery.trim()) return;
    setUnsplashSearchLoading(true);
    setUnsplashError(null);
    try {
      const data = await postJSON<{ urls: string[]; total: number; totalPages: number }>(
        '/api/prepare-site/search-unsplash',
        { query: unsplashQuery.trim(), page }
      );
      setUnsplashResults(data.urls);
      setUnsplashPage(page);
      setUnsplashTotalPages(data.totalPages);
    } catch (err) {
      setUnsplashError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setUnsplashSearchLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Step 3 — Generate colors
  // ---------------------------------------------------------------------------

  async function handleGenerateColors() {
    setStep3Phase('generating_colors');
    setStep3Error(null);
    try {
      const data = await postJSON<{ colorSystem: ColorSystem }>('/api/prepare-site/generate-colors', {
        leadId,
        provider: colorProvider,
        copy,
      });
      setColorSystem(data.colorSystem);
      setStep3Phase('colors_ready');
    } catch (err) {
      setStep3Error(err instanceof Error ? err.message : 'Unknown error');
      setStep3Phase('idle');
    }
  }

  // ---------------------------------------------------------------------------
  // Finalize
  // ---------------------------------------------------------------------------

  async function handlePublish() {
    if (!colorSystem) return;
    setIsPublishing(true);
    try {
      const data = await postJSON<FinalizeResponse>('/api/prepare-site/finalize', {
        leadId,
        copy,
        colorSystem,
        photoHero: heroImage,
        photosGallery: galleryImages,
        photosAiGenerated: isAIFallback,
        hideGallery,
      });
      setFinalizeResult(data);
      onComplete(data.siteUrl);
    } catch (err) {
      setStep3Error(err instanceof Error ? err.message : 'Unknown error');
      setIsPublishing(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Image grid helper
  // ---------------------------------------------------------------------------

  function renderImageGrid(
    urls: string[],
    selected: Set<string>,
    onToggle: (url: string) => void,
    lockedUrl?: string
  ) {
    return (
      <div className="grid grid-cols-5 gap-2 mt-4">
        {urls.map((url) => {
          const isLocked = url === lockedUrl;
          const isSelected = selected.has(url);
          return (
            <button
              key={url}
              type="button"
              onClick={() => !isLocked && onToggle(url)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 focus:outline-none transition-all ${
                isLocked
                  ? 'border-zinc-200 cursor-default'
                  : isSelected
                  ? 'border-blue-500 cursor-pointer'
                  : 'border-transparent cursor-pointer hover:border-zinc-300'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
              {isLocked && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold leading-tight text-center px-1">HERO 🔒</span>
                </div>
              )}
              {!isLocked && isSelected && (
                <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Unsplash panel — shared by step2a (hero) and step2b (gallery)
  // ---------------------------------------------------------------------------

  function renderUnsplashPanel(
    selected: Set<string>,
    onToggle: (url: string) => void,
    lockedUrl?: string
  ) {
    const hasResults = unsplashResults.length > 0;
    const searched = unsplashTotalPages > 0;

    return (
      <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3 mb-6">
        <p className="text-sm font-semibold text-zinc-700">Unsplash Stock Photos</p>

        {/* Search row */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={unsplashQuery}
            onChange={(e) => setUnsplashQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearchUnsplash(1); }}
            placeholder="Search query…"
            className="flex-1 min-w-0 text-sm bg-white border border-zinc-300 rounded-lg px-3 py-1.5 text-zinc-700 placeholder-zinc-400 focus:outline-none focus:border-zinc-400"
          />
          <button
            onClick={handleGenerateUnsplashQuery}
            disabled={unsplashQueryLoading || unsplashSearchLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-200 text-zinc-700 text-xs font-semibold rounded-lg hover:bg-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {unsplashQueryLoading ? <><Spinner /> Generating…</> : 'Generate Search Query'}
          </button>
          <button
            onClick={() => handleSearchUnsplash(1)}
            disabled={!unsplashQuery.trim() || unsplashSearchLoading || unsplashQueryLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 text-white text-xs font-semibold rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {unsplashSearchLoading ? <Spinner /> : 'Search'}
          </button>
        </div>

        {unsplashError && <p className="text-xs text-red-500">{unsplashError}</p>}

        {unsplashSearchLoading && (
          <div className="flex items-center gap-2 text-sm text-zinc-500 py-4">
            <Spinner /> Searching Unsplash…
          </div>
        )}

        {!unsplashSearchLoading && hasResults && (
          <>
            <p className="text-xs text-zinc-400">
              {unsplashResults.length} results — click to select
            </p>
            {renderImageGrid(unsplashResults, selected, onToggle, lockedUrl)}

            {unsplashTotalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => handleSearchUnsplash(unsplashPage - 1)}
                  disabled={unsplashPage <= 1}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <span className="text-xs text-zinc-500">Page {unsplashPage} of {unsplashTotalPages}</span>
                <button
                  onClick={() => handleSearchUnsplash(unsplashPage + 1)}
                  disabled={unsplashPage >= unsplashTotalPages}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-600 border border-zinc-200 rounded-lg hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {!unsplashSearchLoading && !hasResults && !searched && (
          <p className="text-[11px] text-zinc-400">Generate a query or type one, then click Search.</p>
        )}

        {!unsplashSearchLoading && !hasResults && searched && (
          <p className="text-[11px] text-zinc-400">No results found for this query.</p>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Step indicators
  // ---------------------------------------------------------------------------

  function renderStepBar() {
    const steps = [
      { num: 1, label: 'Reviews & Copy', active: currentView === 'step1', done: currentView !== 'step1' },
      { num: 2, label: 'Images', active: currentView === 'step2a' || currentView === 'step2b', done: currentView === 'step3' },
      { num: 3, label: 'Colors', active: currentView === 'step3', done: false },
    ];
    return (
      <div className="flex items-center gap-3 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                s.done ? 'bg-emerald-500 text-white' : s.active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'
              }`}>
                {s.done ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : s.num}
              </div>
              <span className={`text-sm font-medium ${s.active ? 'text-zinc-900' : s.done ? 'text-zinc-400' : 'text-zinc-300'}`}>
                {s.label}
              </span>
            </div>
            {i < 2 && <div className="w-8 h-px bg-zinc-200" />}
          </div>
        ))}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Step 1 render
  // ---------------------------------------------------------------------------

  function renderStep1() {
    return (
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">Reviews & Copy Generation</h2>
        <p className="text-sm text-zinc-500 mb-6">Fetch up to 25 qualified reviews, then generate website copy.</p>

        {/* Phase: idle */}
        {step1Phase === 'idle' && (
          <div className="space-y-4">
            <button
              onClick={handleFetchReviews}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Fetch Reviews from Google Maps →
            </button>
            {step1Error && <ErrorBox message={step1Error} onRetry={handleFetchReviews} />}
          </div>
        )}

        {/* Phase: fetching */}
        {step1Phase === 'fetching_reviews' && (
          <div className="flex items-center gap-3 text-sm text-zinc-500 py-8">
            <Spinner />
            Fetching reviews from Google Maps…
          </div>
        )}

        {/* Phase: reviews ready or later */}
        {(step1Phase === 'reviews_ready' || step1Phase === 'generating_copy' || step1Phase === 'copy_ready') && (
          <div>
            {/* Reviews list */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-700">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''} collected
                <span className="text-zinc-400 font-normal ml-1">(4–5 stars only)</span>
              </h3>
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 mb-6">
              {reviews.length === 0 ? (
                <p className="text-sm text-zinc-400 py-4 text-center">No qualifying reviews found.</p>
              ) : (
                reviews.map((r, i) => <ReviewCard key={i} review={r} />)
              )}
            </div>

            {/* Copy generation controls */}
            {step1Phase === 'reviews_ready' && (
              <div className="border-t border-zinc-100 pt-5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-700">Generate website copy using:</p>
                  <LLMSelector value={copyProvider} onChange={setCopyProvider} />
                </div>
                <button
                  onClick={handleGenerateCopy}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Generate Copy →
                </button>
                {step1Error && <ErrorBox message={step1Error} onRetry={handleGenerateCopy} />}
              </div>
            )}

            {step1Phase === 'generating_copy' && (
              <div className="border-t border-zinc-100 pt-5 flex items-center gap-3 text-sm text-zinc-500">
                <Spinner />
                Generating copy with {copyProvider === 'anthropic' ? 'Claude' : 'Gemini'}…
              </div>
            )}

            {step1Phase === 'copy_ready' && copy && (
              <div className="border-t border-zinc-100 pt-5 space-y-4">
                {/* Copy preview */}
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Hero Headline</p>
                    <p className="text-base font-bold text-zinc-900">{copy.hero_headline}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Subheadline</p>
                    <p className="text-sm text-zinc-700">{copy.hero_subheadline}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">Services</p>
                    <div className="flex flex-wrap gap-1.5">
                      {copy.services.map((s, i) => (
                        <span key={i} className="text-xs bg-zinc-200 text-zinc-700 px-2 py-0.5 rounded-full">
                          {typeof s === 'string' ? s : `${s.icon} ${s.name}`}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">CTA</p>
                    <p className="text-sm text-zinc-700 italic">{copy.cta_tagline}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-0.5">SEO Title</p>
                    <p className="text-sm text-zinc-700">{copy.seo_title}</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setCurrentView('step2a')}
                    className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
                  >
                    Next: Select Images →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Step 2a render — Hero selection
  // ---------------------------------------------------------------------------

  function renderStep2a() {
    const heroSet = new Set(heroImage ? [heroImage] : []);
    function toggleHero(url: string) {
      setHeroImage((prev) => (prev === url ? null : url));
    }

    return (
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">Select Hero Photo</h2>
        <p className="text-sm text-zinc-500 mb-6">Choose the main image displayed at the top of the site.</p>

        {(step2Phase === 'idle' || step2Phase === 'fetching_images') && !step2Error && (
          <div className="flex items-center gap-3 text-sm text-zinc-500 py-8">
            <Spinner />
            Fetching photos from Google Maps…
          </div>
        )}

        {step2Error && step2Phase === 'idle' && (
          <ErrorBox message={step2Error} onRetry={handleFetchImages} />
        )}

        {step2Phase === 'ready' && (
          <div>
            {/* Google Maps photos */}
            {imageUrls.length > 0 ? (
              <div className="mb-6">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Google Maps Photos <span className="font-normal normal-case text-zinc-400">({imageUrls.length} found) — click to select hero</span>
                </p>
                {renderImageGrid(imageUrls, heroSet, toggleHero)}
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 mb-6">
                <p className="text-sm text-zinc-600 font-medium">No photos found on Google Maps.</p>
                <p className="text-sm text-zinc-500 mt-0.5">Generate an AI hero image below.</p>
              </div>
            )}

            {/* AI generated hero photos */}
            {aiHeroImageUrls.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  AI Hero Images <span className="font-normal normal-case text-zinc-400">({aiHeroImageUrls.length}) — click to select</span>
                </p>
                {renderImageGrid(aiHeroImageUrls, heroSet, toggleHero)}
              </div>
            )}

            {/* Hero preview */}
            {heroImage && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Hero Preview</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroImage} alt="Hero preview" referrerPolicy="no-referrer" className="w-full max-h-52 object-cover rounded-xl border border-zinc-200" />
              </div>
            )}

            {/* Unsplash search panel */}
            {renderUnsplashPanel(heroSet, toggleHero)}

            {/* AI generation panel */}
            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3 mb-6">
              <p className="text-sm font-semibold text-zinc-700">AI Image Generation <span className="text-xs font-normal text-zinc-400">via Google Gemini</span></p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-white border border-zinc-300 rounded-lg px-2 py-1.5">
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={aiHeroCount}
                    onChange={(e) => setAiHeroCount(Math.min(4, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                    className="w-8 text-xs text-zinc-700 focus:outline-none text-center bg-transparent"
                  />
                </div>
                <button
                  onClick={handleGenerateHeroImages}
                  disabled={aiHeroLoading}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {aiHeroLoading ? <><Spinner /> Generating…</> : 'Generate Hero Image →'}
                </button>
              </div>
              {aiHeroError && <p className="text-xs text-red-500">{aiHeroError}</p>}
              <p className="text-[11px] text-zinc-400">Generates a dramatic wide-angle hero shot. Max 4 at a time.</p>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('step1')}
                className="px-4 py-2.5 text-sm font-semibold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setCurrentView('step2b')}
                disabled={!heroImage}
                className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next: Gallery →
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Step 2b render — Gallery selection
  // ---------------------------------------------------------------------------

  function renderStep2b() {
    const gallerySet = new Set(galleryImages);

    function toggleGallery(url: string) {
      setGalleryImages((prev) =>
        prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
      );
    }

    return (
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">Select Gallery Images</h2>
        <p className="text-sm text-zinc-500 mb-2">Choose images for the gallery section. Hero is locked.</p>
        <p className="text-sm text-zinc-500 mb-4">
          <span className="font-medium text-zinc-700">{galleryImages.length}</span> selected
        </p>

        {imageUrls.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Google Maps Photos</p>
            {renderImageGrid(imageUrls, gallerySet, toggleGallery, heroImage ?? undefined)}
          </div>
        )}

        {aiGalleryImageUrls.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              AI Gallery Images <span className="font-normal normal-case text-zinc-400">({aiGalleryImageUrls.length})</span>
            </p>
            {renderImageGrid(aiGalleryImageUrls, gallerySet, toggleGallery, heroImage ?? undefined)}
          </div>
        )}

        {/* Unsplash search panel */}
        {renderUnsplashPanel(gallerySet, toggleGallery, heroImage ?? undefined)}

        {/* AI gallery generation panel */}
        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4 space-y-3 mb-6">
          <p className="text-sm font-semibold text-zinc-700">AI Image Generation <span className="text-xs font-normal text-zinc-400">via Google Gemini</span></p>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-white border border-zinc-300 rounded-lg px-2 py-1.5">
              <input
                type="number"
                min={1}
                max={20}
                value={aiGalleryCount}
                onChange={(e) => setAiGalleryCount(Math.min(20, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                className="w-8 text-xs text-zinc-700 focus:outline-none text-center bg-transparent"
              />
            </div>
            <button
              onClick={handleGenerateGalleryImages}
              disabled={aiGalleryLoading}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-800 text-white text-sm font-semibold rounded-lg hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {aiGalleryLoading ? <><Spinner /> Generating…</> : aiGalleryImageUrls.length > 0 ? 'Generate More →' : 'Generate Gallery Images →'}
            </button>
          </div>
          {aiGalleryError && <p className="text-xs text-red-500">{aiGalleryError}</p>}
          <p className="text-[11px] text-zinc-400">Generates varied service/work photos for the gallery. Max 20 at a time.</p>
        </div>

        {/* Hide gallery toggle */}
        <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={hideGallery}
            onChange={(e) => setHideGallery(e.target.checked)}
            className="w-4 h-4 rounded accent-zinc-900 cursor-pointer"
          />
          <div>
            <p className="text-sm font-medium text-zinc-700">Hide gallery section on the website</p>
            <p className="text-xs text-zinc-400 mt-0.5">The gallery will not be shown on the published site.</p>
          </div>
        </label>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentView('step2a')}
            className="px-4 py-2.5 text-sm font-semibold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => setCurrentView('step3')}
            className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Confirm Images →
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Step 3 render — Colors
  // ---------------------------------------------------------------------------

  function renderStep3() {
    return (
      <div>
        <h2 className="text-xl font-semibold text-zinc-900 mb-1">Color Design System</h2>
        <p className="text-sm text-zinc-500 mb-6">Generate a 7-color brand palette for this business.</p>

        {step3Phase === 'idle' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-200 px-4 py-3">
              <p className="text-sm font-medium text-zinc-700">Generate colors using:</p>
              <LLMSelector value={colorProvider} onChange={setColorProvider} />
            </div>
            <button
              onClick={handleGenerateColors}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white text-sm font-semibold rounded-xl hover:bg-zinc-700 transition-colors"
            >
              Generate Color System →
            </button>
            {step3Error && <ErrorBox message={step3Error} onRetry={handleGenerateColors} />}
          </div>
        )}

        {step3Phase === 'generating_colors' && (
          <div className="space-y-3 py-4">
            {[
              'Analyzing business type and category',
              'Selecting primary brand color',
              'Building complementary palette',
              'Validating contrast ratios',
            ].map((label, i) => (
              <div key={i} className="flex items-center gap-2.5 text-sm text-zinc-500">
                <Spinner />
                {label}
              </div>
            ))}
          </div>
        )}

        {step3Phase === 'colors_ready' && colorSystem && (
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Generated Palette</p>
              <div className="flex gap-2 flex-wrap">
                {COLOR_LABELS.map(({ key, label }) => {
                  const hex = colorSystem[key];
                  const dark = isDarkColor(hex);
                  return (
                    <div key={key} className="flex flex-col items-center gap-1.5">
                      <div
                        className="w-16 h-11 rounded-lg border border-zinc-200 flex items-end justify-center pb-1"
                        style={{ backgroundColor: hex }}
                      >
                        <span className="text-[9px] font-mono font-bold" style={{ color: dark ? '#ffffff99' : '#00000099' }}>
                          {hex}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-500">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentView('step2b')}
                disabled={isPublishing || !!finalizeResult}
                className="px-4 py-2.5 text-sm font-semibold text-zinc-600 border border-zinc-200 rounded-xl hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || !!finalizeResult}
                className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isPublishing ? (
                  <span className="inline-flex items-center gap-2"><Spinner /> Publishing…</span>
                ) : finalizeResult ? '✓ Published' : 'Publish Site →'}
              </button>
            </div>

            {step3Error && <ErrorBox message={step3Error} />}
          </div>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Layout
  // ---------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto py-12 px-4">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="px-8 pt-7 pb-0">
          {/* Business identity strip */}
          <div className="flex items-start justify-between mb-5">
            <div className="space-y-0.5">
              <p className="text-base font-bold text-zinc-900 leading-snug">{leadName ?? '—'}</p>
              <div className="flex items-center gap-3 flex-wrap">
                {leadAddress && (
                  <span className="text-xs text-zinc-500">
                    {[leadAddress.city, leadAddress.state].filter(Boolean).join(', ')}
                  </span>
                )}
                {leadPhone && (
                  <span className="text-xs text-zinc-500">{leadPhone}</span>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors text-xl leading-none flex-shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          {renderStepBar()}
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {currentView === 'step1' && renderStep1()}
          {currentView === 'step2a' && renderStep2a()}
          {currentView === 'step2b' && renderStep2b()}
          {currentView === 'step3' && renderStep3()}
        </div>
      </div>
    </div>
  );
}
