# Rule: Coding Patterns & Conventions

## TypeScript

- All files are `.ts` / `.tsx` — no plain JS
- Use named exports for components; default export only on Next.js page/layout files
- Prefer `interface` over `type` for object shapes; `type` for unions/aliases
- Never use `any` — use `unknown` and narrow, or define a proper interface

## Tailwind CSS

- Use Tailwind utility classes for layout, spacing, typography
- Reference color system ONLY via CSS variables: `bg-[var(--color-primary)]`,
  `text-[var(--color-text)]` — never hardcode hex values in component className strings
- No component library installs (no shadcn, no MUI, no Radix) — build from scratch

## Apify Calls

All Apify calls use the synchronous run-and-wait pattern:
```
POST https://api.apify.com/v2/acts/{ACTOR_ID}/runs?token={KEY}&waitForFinish=300
```
Always check `run?.data?.id` before accessing `defaultDatasetId`. Return early with an
error if the run fails to start — do not assume success.

Actor ID is always: `compass~crawler-google-places`

## Image Handling

- All selected/generated images are uploaded to Supabase Storage under
  `business-photos/{slug}/` before being saved to the `businesses` row
- Never store Apify image URLs directly in the database — they expire
- Serve images via Next.js `<Image>` with `sizes` and `srcSet` from Supabase Storage CDN
- Hero image: `priority` prop. Gallery images: `loading="lazy"`

## SEO

Every business page must have:
- `generateMetadata()` exporting `Metadata` with `title`, `description`, `keywords`,
  `alternates.canonical`, and `openGraph`
- `<SiteJsonLd>` with `LocalBusiness` schema including `aggregateRating`
- Exactly one `<h1>` on the page (the hero headline)
- All images have descriptive `alt` attributes

## Environment Variables

- `NEXT_PUBLIC_*` prefix only for values needed in client components
- `SUPABASE_SERVICE_ROLE_KEY` and `ANTHROPIC_API_KEY` and `APIFY_API_KEY` are
  server-only — never expose to client
- Always read from `process.env.VAR_NAME!` with non-null assertion in server code;
  validate presence at startup in critical paths

## Error Handling

- All Apify fetch calls: wrap in try/catch; propagate errors as SSE `error` events
- All `JSON.parse()` calls on Claude responses: wrap in try/catch; log raw response if
  parse fails
- Dashboard PATCH routes: return `400` for invalid field names, `404` for missing lead

## File Naming

- Route handlers: `route.ts`
- Server components: `PascalCase.tsx`
- Utility functions: `camelCase.ts`
- Rules files: `kebab-case.md`
