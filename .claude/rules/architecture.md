# Rule: Architecture Constraints

## Multi-Tenancy — How Routing Works

Every business site is served by a SINGLE Next.js deployment. There is no per-client
build, branch, or deployment. Middleware reads the `host` header, injects either
`x-business-slug` or `x-custom-domain`, and `resolveBusinessFromRequest()` in
`lib/resolve-business.ts` queries Supabase for the matching business row.

**Never suggest creating separate deployments, repos, or builds per client.**

## One Template Rule

There is exactly one site template in `components/site/`. Do not create variant
templates. Visual differentiation comes exclusively from the `color_system` JSON stored
per business in the `businesses` table — applied as CSS custom properties on the root
div.

## Data Flow Constraints

| Stage | What happens | What does NOT happen |
|---|---|---|
| Ingestion | Insert lead metadata (counts, address, phone) | Fetch review text or images |
| Wizard Step 1 | Fetch reviews from Apify → Claude copy | Fetch images |
| Wizard Step 2 | Fetch images from Apify → user selects | Re-fetch reviews |
| Wizard Step 3 | Claude generates colors | Any Apify calls |
| Finalize | INSERT businesses row | Modify leads schema |

**Never move review or image fetching to ingestion time.** Cost and latency rationale is
documented in the spec. The wizard fetches on-demand for interested leads only.

## Supabase Usage

- Server-side routes use `createClient()` from `lib/supabase/server.ts` (service role)
- Client components use `lib/supabase/client.ts` (anon key)
- Never call Supabase from `middleware.ts` (performance — middleware runs on every request)
- `businesses` rows are INSERT-only from the wizard finalizer; update only via dashboard
  PATCH endpoints

## API Routes

- Wizard orchestrator (`/api/prepare-site`) uses **Server-Sent Events (SSE)** — do not
  convert to polling or WebSockets
- Lead PATCH (`/api/leads/[id]`) only allows updating: `status`, `notes`,
  `purchased_domain`. It also handles `custom_domains` upsert on domain save.
- Contact form submissions go to `/api/leads/capture` → `site_leads` table

## Slug Generation

Slugs are derived from business name (kebab-case, de-duped with a numeric suffix if
needed). They are permanent once created — never regenerate a slug for an existing
business. Custom domain traffic continues to work alongside the original slug forever.

## Claude API Rules

- Always use model `claude-sonnet-4-20250514` — never swap to opus or haiku without
  explicit instruction
- Always request JSON-only output with no markdown fences in the prompt itself
- Parse with `JSON.parse(raw)` — never regex parse Claude responses
- Copy generation: `max_tokens: 2000` / Color generation: `max_tokens: 400`
