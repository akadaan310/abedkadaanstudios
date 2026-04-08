# CLAUDE.md — Local Business Website Generator (v3.1)

## Project Purpose
Automated discovery → site generation → sales workflow for solo local service businesses with no web presence. One Next.js deployment serves infinite business sites via subdomain routing. $120/sale price point.

## Stack
- **Framework**: Next.js (App Router, latest)
- **Styling**: Tailwind CSS (utility classes only — no component libraries)
- **Database**: Supabase (Postgres + Storage)
- **Lead scraping**: Apify `compass/crawler-google-places`
- **AI copy/colors**: Anthropic Claude API (`claude-sonnet-4-20250514`)
- **AI image fallback**: Google Gemini Imagen or Claude
- **Hosting**: Vercel (wildcard subdomain `*.abedkadaan.com`)

## Key URLs
| Surface | URL |
|---|---|
| Dashboard | `dashboardx.abedkadaan.com` |
| Business sites | `{slug}.abedkadaan.com` |
| Post-sale | Client's own domain (CNAME → Vercel) |

## Directory Layout
```
/
├── app/
│   ├── (dashboard)/
│   │   ├── layout.tsx                          # Dashboard shell — only renders for dashboardx subdomain
│   │   └── page.tsx                            # Lead list + IngestPanel + PrepareWizard modal
│   ├── api/
│   │   ├── leads/
│   │   │   ├── ingest/
│   │   │   │   ├── route.ts                    # POST — triggers Apify run, calls process.ts
│   │   │   │   └── process.ts                  # Filter no-website places, insert leads, computeScoreLabel()
│   │   │   └── [id]/
│   │   │       └── route.ts                    # PATCH status | notes | purchased_domain; upserts custom_domains
│   │   ├── prepare-site/
│   │   │   ├── route.ts                        # POST — SSE orchestrator; streams step/progress/error events
│   │   │   ├── fetch-reviews.ts                # Step 1a: Apify run for placeId, filters 4/5-star, max 25
│   │   │   ├── generate-copy.ts                # Step 1b: Claude claude-sonnet-4-20250514, returns BusinessCopy JSON
│   │   │   ├── fetch-images.ts                 # Step 2: Apify run for placeId, returns image URL[]
│   │   │   ├── generate-images.ts              # Step 2 fallback: Gemini Imagen or Claude image generation
│   │   │   ├── generate-colors.ts              # Step 3: Claude claude-sonnet-4-20250514, returns ColorSystem JSON
│   │   │   └── finalize/
│   │   │       └── route.ts                    # POST — INSERT businesses row, UPDATE leads.status → emailed
│   │   ├── leads/
│   │   │   └── capture/
│   │   │       └── route.ts                    # POST — contact form submission → INSERT site_leads
│   │   └── post-sale/
│   │       └── verify-domain/
│   │           └── route.ts                    # POST — SET custom_domains.verified = true
│   ├── page.tsx                                # Business site renderer — resolves slug/domain → renders template
│   ├── sitemap.ts                              # Auto-generated sitemap from all businesses rows
│   ├── robots.ts                               # Allow all crawlers
│   └── layout.tsx                              # Root layout — minimal, no global nav
├── components/
│   ├── site/
│   │   ├── SiteNav.tsx                         # Sticky top nav: business name + tap-to-call (--color-accent)
│   │   ├── SiteHero.tsx                        # Full-viewport hero image + gradient + headline + CTA
│   │   ├── SiteServices.tsx                    # 2-col/3-col service cards with icon + name + sentence
│   │   ├── SiteAbout.tsx                       # 3 about paragraphs + star rating stat panel
│   │   ├── SiteReviewsCarousel.tsx             # Snap-scroll horizontal review cards, auto-advances 4s
│   │   ├── SiteLeadForm.tsx                    # First Name + Phone + Message → /api/leads/capture
│   │   ├── SiteGallery.tsx                     # Masonry grid + full-screen lightbox, lazy loaded
│   │   ├── SiteContact.tsx                     # Address + Google Maps iframe + phone + hours table
│   │   ├── SiteHours.tsx                       # Hours table sub-component used by SiteContact
│   │   ├── SiteJsonLd.tsx                      # LocalBusiness schema script tag
│   │   └── SiteFooter.tsx                      # Name + subheadline + phone + address, dark bg
│   └── dashboard/
│       ├── LeadRow.tsx                         # Single table row: score pill, status dropdown, inline edits
│       ├── IngestPanel.tsx                     # Import form: location + category + target leads + cost estimate
│       └── PrepareWizard.tsx                   # Full-screen modal; renders Step1/Step2/Step3 sub-views via SSE
├── lib/
│   ├── supabase/
│   │   ├── client.ts                           # createBrowserClient — anon key, used in client components
│   │   └── server.ts                           # createServerClient — service role key, used in route handlers
│   ├── resolve-business.ts                     # Reads x-business-slug or x-custom-domain header → Supabase query
│   ├── generate-slug.ts                        # kebab-case from business name + numeric de-dupe
│   └── upload-to-supabase.ts                   # Base64 or URL → Supabase Storage under business-photos/{slug}/
├── types/
│   ├── lead.ts                                 # Lead, ApifyPlace, Review interfaces
│   ├── business.ts                             # Business, BusinessCopy, ColorSystem interfaces
│   └── dashboard.ts                            # ScoreLabel, LeadStatus union types
├── middleware.ts                               # Injects x-business-slug or x-custom-domain; passes dashboardx through
├── next.config.ts                              # Wildcard image domains for Supabase Storage CDN
├── tailwind.config.ts                          # No custom theme — all colors via CSS vars at runtime
├── tsconfig.json
├── .env.local                                  # All secrets — never commit
├── CLAUDE.md
└── .claude/
    └── rules/
        ├── no-library-imports.md
        ├── architecture.md
        └── coding-patterns.md
```

## Database Tables (summary)
| Table | Purpose |
|---|---|
| `leads` | Raw Apify data + sales state. `reviews_raw` NULL until wizard |
| `businesses` | Claude copy + images + color_system. Created by wizard |
| `site_leads` | Contact form submissions from live sites |
| `custom_domains` | Post-sale domain mappings (`verified` flag) |

`score_label` computed at ingestion based on reviews only: `hot` (21+ reviews), `warm` (6–20 reviews), `cold` (else).

## Routing Logic (`middleware.ts`)
> Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts` — **do not migrate**. The deprecation warning is intentionally ignored; `middleware.ts` still works and migration is deferred indefinitely.

- `dashboardx.*` → dashboard route group, pass through
- `{slug}.abedkadaan.com` → set header `x-business-slug: {slug}`
- Custom domain → set header `x-custom-domain: {host}`
- `resolveBusinessFromRequest()` reads these headers to query Supabase

## Wizard Flow (SSE stream — `POST /api/prepare-site`)
1. **Step 1 — auto**: Fetch up to 25 reviews via Apify → persist to `leads.reviews_raw` → Claude generates copy JSON
2. **Step 2 — manual**: Fetch up to 25 images via Apify → user selects hero + gallery → fallback to AI gen if no photos
3. **Step 3 — auto**: Claude generates 7-color `color_system` JSON → "Publish Site" → INSERT `businesses` row → site live

## Claude API Usage
- **Model**: always `claude-sonnet-4-20250514`
- **Copy prompt**: returns strict JSON (no markdown fences). Fields: `hero_headline`, `hero_subheadline`, `about_text`, `services[]`, `cta_tagline`, `seo_title`, `seo_description`, `seo_keywords[]`
- **Color prompt**: returns strict JSON with 7 hex values: `primary`, `secondary`, `accent`, `background`, `surface`, `text`, `textLight`
- Parse responses with `JSON.parse(raw)` — never regex

## Color System Application
CSS custom properties injected inline on the root `<div>` in `app/page.tsx`:
```
--color-primary / --color-secondary / --color-accent
--color-background / --color-surface / --color-text / --color-text-light
```
All site components reference `var(--color-*)` — never hardcoded hex values in components.

## SEO Requirements (every business site)
- `generateMetadata()` sets `title`, `description`, `keywords`, canonical, OG tags
- `SiteJsonLd` outputs `LocalBusiness` schema with `aggregateRating` and up to 5 `review` items
- One `<h1>` (hero headline), `<h2>` per section
- `priority` on hero image, `loading="lazy"` on gallery
- Auto-generated `sitemap.xml` from all `businesses` rows

## Apify Cost Formula
```
Ingestion:   $0.007 + ($0.005 × total_places_scraped)
Per wizard:  ~$0.024 reviews  +  ~$0.024 images  =  ~$0.048
```
Reviews and images are NEVER fetched at ingestion — only during the wizard for interested leads.

## Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
APIFY_API_KEY
GEMINI_API_KEY
NEXT_PUBLIC_APP_DOMAIN=abedkadaan.com
NEXT_PUBLIC_DASHBOARD_SUBDOMAIN=dashboardx
```
