# SkillScout catalogue: how the 277 resources were checked

This folder holds the work behind `lib/data/resources.ts`, the seed for the `resources` table.
Every entry is a free resource, and every URL was checked before it was added.

## Totals

- **277 entries** across **18 categories** (spec target: 270–360).
- Verification status is recorded per row in `review.csv`.

| Status | Count |
| --- | --- |
| HTTP 200 | 217 |
| Channel exists (HTTP 200) | 36 |
| Verified in headless browser | 11 |
| Kaggle bot check, not machine-verified (spot-check in browser) | 7 |
| Free content, page shows a free-trial banner (manual check) | 6 |

## Method

1. **Candidates.** Candidates were gathered by category into `candidates-1.tsv` to `candidates-6.tsv`.
   Format: `category|title|platform|url|format|difficulty|hours|tags|description`.
2. **Curl check.** `verify.py` requests each URL and records the HTTP status.
   Some sites give different answers on repeat requests, so those URLs were re-checked in a browser.
3. **Browser check.** `browse_check.py` (Playwright) covers the 45 URLs in `browse-list.txt`,
   including pages that block curl or show bot walls.
4. **Build.** `build_final.py` applies the drop list, removes duplicate URLs, and writes `final.tsv`.
   Coursera and edX browse pages were dropped in this step.
5. **Generate.** `generate_resources.py` writes `lib/data/resources.ts` from `final.tsv`,
   using `resources.header.txt` as the file header. Run it from the project root.

## Rules applied

- **Free only.** Entries that are paid, trial-gated, or sign-up-gated for the core content were dropped.
- **No invented URLs.** An entry is kept only if its URL was reached and its title matched the page.
- **Dropped by rule.** Cloudflare-blocked, login-walled, or 403-only pages were dropped
  (for example rpstrength.com, digitalcameraworld.com, forvo.com, fitness.gov, photographyconcentrate.com).
- **Guessed URLs that returned 404 were dropped**, not replaced with near matches.

## Entries needing a manual check

These are kept but flagged in `review.csv`:

- **Kaggle Learn (7 pages).** Kaggle serves a reCAPTCHA wall to automated checks, so the pages
  could not be machine-verified. Open each one in a normal browser before launch.
- **Free-trial banners (6 pages).** The content is free, but the page shows a trial upsell.
  Confirm the core content has no trial gate:
  - Mailchimp resources
  - Semrush YouTube channel
  - Semrush Academy
  - Moz SEO guide
  - Jeff Nippard
  - In The Mix
- **Duolingo and Typewolf** stay. Their only automated-check problem was captcha text on the page.

## Known gaps

- Some topics have only one or two resources. For example, Rust has one Rust-specific entry,
  so an AI roadmap for "learn rust" uses only that one resource. Adding more Rust-specific
  resources would improve those roadmaps.
- Searches for skills with no catalogue entry (such as Excel) fall back to a template roadmap
  built from the closest category.

## Files

| File | Purpose |
| --- | --- |
| `candidates-1..6.tsv` | Raw candidates by category |
| `verify.py` | Curl-based HTTP checker |
| `browse_check.py` | Playwright checker for bot-blocked pages |
| `browse-list.txt` | The 45 URLs sent to the browser checker |
| `build_final.py` | Drop list, de-duplication, writes `final.tsv` |
| `final.tsv` | The 277 approved rows |
| `generate_resources.py`, `resources.header.txt` | Generate `lib/data/resources.ts` |
| `review.csv` | Human-readable review list with verification status |
| `resources.before.ts` | Backup of the earlier 54-entry starter catalogue |
