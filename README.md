# SkillScout

"Your shortcut to any skill. Learn anything. Pay nothing."

A Next.js 14 (App Router) PWA. Describe a skill and get curated free resources from verified platforms, plus a week-by-week roadmap with prerequisites and time estimates.

## Run it locally

```bash
npm install
cp .env.example .env.local   # optional; the app runs with no keys (demo mode)
npm run dev                  # or: npm run build && npm start
```

Open http://localhost:3000.

## Modes

| Feature | Without env vars | With env vars |
|---|---|---|
| Accounts | Browser-local demo accounts | Supabase Auth (email + Google OAuth) |
| Route protection | Client-side guard | `middleware.ts` (server-side) |
| Roadmaps | Template plan from verified resources | Groq `openai/gpt-oss-120b` (override with `GROQ_MODEL`), personalised, validated |
| Analytics | Off | Plausible (lazy-loaded) |

## Environment variables

See `.env.example`. Summary:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: enable Supabase Auth.
- `SUPABASE_SERVICE_ROLE_KEY`: reserved for server-side writes (not used yet).
- `GROQ_API_KEY`: enables AI roadmaps. Without it, the verified template is used.
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`: enables analytics.
- `NEXT_PUBLIC_APP_URL`: used for metadata, sitemap, and OAuth redirects.
- `NEXT_PUBLIC_LEARNER_COUNT`: value for the "learners" stat. Blank shows "Be the first".

## Supabase setup

1. Create a project and run `supabase/schema.sql` in the SQL editor. It creates all spec tables, indexes, RLS policies, and a trigger that mirrors new auth users into `public.users`.
2. Auth → Providers: enable Email, and Google (add your OAuth client).
3. Auth → URL configuration: add your site URL and `https://<your-domain>/auth/callback`.
4. Load the verified catalogue so saved progress can reference it: set `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`, then run `npm run seed`. It is safe to re-run.

Signed-in users get server storage for saved roadmaps, checkbox progress, search history, and roadmap feedback. Row Level Security limits every query to the user's own rows. Signed-out and demo users keep everything in the browser.

| Route | Purpose |
|---|---|
| `GET/POST /api/roadmaps` | List your roadmaps with progress and feedback; save a roadmap (URLs are rebuilt from the catalogue) |
| `PATCH /api/roadmaps/[id]/progress` | Set one resource's completion state |
| `GET/POST /api/history` | Your search history |
| `POST /api/feedback` | Stores feedback on your saved roadmaps |

## How the search works

1. `POST /api/search` normalises the query and hashes `query + level + filters` (SHA-256) for the cache key.
2. Cache hit (24h TTL, AI responses only) returns immediately.
3. Otherwise the query is scored against `lib/data/resources.ts`: skill tags, title, category hints and synonyms, with description-only matches ignored as too noisy. Filters (difficulty, format, duration) apply before ranking.
4. The roadmap comes from Groq if configured and within the rate limit (5 AI calls/min per IP). The model receives only the verified resource ids. Its output is validated with Zod, every resource id is re-mapped to the DB record, and URLs always come from the DB. Anything unmatched is dropped.
5. Invalid JSON gets one retry. Timeouts (8s) and errors fall back to the template roadmap, and the response's `roadmapStatus` says which path was used.

## Content: what's seeded and what isn't

`lib/data/resources.ts` holds **277 free resources across 18 categories**, within the spec's 270–360 target. Each entry was checked before it was added. `catalogue/README.md` explains the method, and `catalogue/review.csv` lists every entry with its verification status.

- Every URL returned HTTP 200 or was checked in a headless browser. Dead links, paid or trial-gated pages, and login walls were dropped. Coursera and edX were excluded.
- **Please spot-check before launch:**
  - Seven Kaggle Learn links. Kaggle's reCAPTCHA blocks automated checks, so they were not verified here.
  - Six free pages that show a free-trial banner.
  - About 90 site-root URLs, which may be landing pages rather than single courses.
  - YouTube channels, which were verified only to exist.
- The catalogue is curated by hand. Regenerate `resources.ts` from `catalogue/final.tsv` with `python3 catalogue/generate_resources.py`.

To add resources, add them to `catalogue/` and regenerate, or append directly to `RESOURCES` and re-run the build. The `id` is derived from the URL, so a given URL always keeps the same id.

## Known gaps versus the spec

- **Server persistence is implemented but not tested against a live Supabase project.** The storage routes return 503 without Supabase configured and 401 when signed out. Those responses were tested. The signed-in paths (RLS, progress upserts, the seed script) have not run against a real database.
- **Local data does not migrate on first sign-in.** Once signed in, the server copy replaces the browser copy for roadmaps and history. Unsaved local-only roadmaps are kept.
- **Supabase and Groq paths are untested against live services.** No keys were available. The template fallback and the search API were tested end to end. The sign-up, sign-in, OAuth, and middleware code compiles, but it has not run against a real project.
- **Logo:** the mark is a single stroke bent into an S, ending at an orange waypoint. Source is `components/brand/Logo.tsx` and `public/icons/icon.svg`. PNG icons were rendered from the SVG.
- **Rate limiting and caching are in-memory.** Each serverless instance has its own copy. For production, swap `lib/cache.ts` for Upstash Redis. The interface is small.
- **Rate limiting is per IP,** not per user, because the search endpoint does not require sign-in.
- **No pgvector semantic search.** Ranking is token/tag scoring in the app. The schema enables the `vector` extension, but embeddings are not generated yet.
- **Service worker is hand-written** (`public/sw.js`) instead of `next-pwa`, which is unmaintained for the App Router. It caches static assets and pages for offline use, and never caches POST requests.
- **Sitemap and robots** use Next's native `app/sitemap.ts` and `app/robots.ts` instead of `next-sitemap`.
- **Fonts are self-hosted via `@fontsource`** (Space Grotesk, Inter, JetBrains Mono) rather than `next/font/google`, so builds work without network access to Google.
- **Next.js is pinned to 14.2.35.** Earlier 14.2.x releases carry a security advisory.
- **Not browser-tested:** onboarding, dashboard, roadmap save/progress, profile, history, and the auth forms. Landing, search (light/dark, desktop/mobile), the API, and the hero animation were checked in a headless browser.
- **No formal accessibility audit or Lighthouse run.** Focus rings, skip link, ARIA labels, reduced-motion handling, and colour choices are in place. Small orange text uses `#C2410C` in light mode for contrast, not `#FF6B2B`.

## Project layout

```
app/                  routes (pages, route handlers, auth callback)
components/           layout, landing, search, auth, about, ui
lib/                  search ranking, roadmap (Groq + template), cache, schemas, store, auth state
lib/data/resources.ts seeded verified catalogue
middleware.ts         Supabase session guard for /dashboard and /onboarding
public/               manifest, service worker, icons
supabase/schema.sql   database schema, RLS, auth trigger
scripts/seed-resources.ts  loads the catalogue into Supabase (npm run seed)
components/brand/Logo.tsx  logo mark and wordmark
```
