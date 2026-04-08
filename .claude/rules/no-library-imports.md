# Rule: No Library or Framework Source Ingestion

## NEVER read these into context under any circumstances

When working on this project, do NOT read, cat, or otherwise load the source files of
any installed library or framework — even if you think it would help. This includes but
is not limited to:

- `node_modules/**` — any file under node_modules, regardless of depth
- Next.js internals (`next/dist/**`, `.next/**`)
- React source (`react/cjs/**`, `react-dom/**`)
- Tailwind source or generated CSS (`tailwind.config.*` is fine to read; the Tailwind
  source package itself is not)
- Supabase client internals (`@supabase/supabase-js/dist/**`)
- Anthropic SDK internals (`@anthropic-ai/sdk/dist/**`)
- Any `.d.ts` type definition file you did not explicitly write for this project

## Why this rule exists

Library source files are large, noisy, and consume context window that should be used
for actual project code. They never need to be read to use an API correctly. If you are
unsure how an API works, rely on your training knowledge or ask the user — do not reach
for node_modules.

## What you MAY read

- Any file under `app/`, `components/`, `lib/`, `middleware.ts`, config files at the
  project root (`next.config.*`, `tailwind.config.*`, `tsconfig.json`, `.env.local`)
- `package.json` (to check what is installed — reading the name/version is fine)
- `CLAUDE.md` and `.claude/rules/**`

## Correct pattern when you need to know an API

Bad:  `cat node_modules/@anthropic-ai/sdk/dist/index.js`
Good: Use your knowledge of the Anthropic SDK. If uncertain, ask the user.
