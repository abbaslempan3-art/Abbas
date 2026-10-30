# Affiliate Autopilot — issue #66

Static, free-first local prototype. All files use relative URLs and require no build
or CDN. Keep the directory intact at `/Abbas/affiliate-autopilot/` on GitHub Pages.
No deployment, paid service, AI call, scraping, or publishing is part of setup.
`PUBLISH_ENABLED=false` and `CLOUD_ENABLED=false`; there is no publishing or cloud
adapter. Do not merge to main or publish automatically.

## Run and test

Use the current isolated checkout; do not create a worktree. From repository root:

```sh
npm ci
node --test affiliate-autopilot/tests/model.test.mjs
npx playwright test -c affiliate-autopilot/playwright.config.ts
```

Node 24 and Python 3 are used. The browser configuration defaults to
`/usr/bin/chromium`; set `CHROMIUM_PATH` to another installed Chromium if needed.
The test server serves the workspace parent to test the actual Pages subpath.
For manual development from `/workspace`, run:

```sh
python3 -m http.server 8766 --bind 127.0.0.1 --directory /workspace
```

Then request `/Abbas/affiliate-autopilot/` locally. No Supabase, account, API key,
or external application service is needed. Browser data is not encrypted and is
not suitable for secrets, real customer records or financial records.

## Data and manual workflow

- Existing `aa_products` arrays of `{name,link}` remain readable. Loading never
  writes or seeds localStorage. New sample data is explicitly labeled SAMPLE.
- Add/edit/delete products. Deleting a product retains its queued script snapshot.
- JSON export backs up **products only**, not the production queue. Import accepts
  version 1 `{version:1,products:[...]}` and legacy arrays, previews the count and
  requires confirmation. It adds new entries, skips exact duplicates, and does not
  overwrite existing products. Limit: 1 MB and 500 products. Export before import.
- Queue lives separately in `aa_queue_v1`. Drafts retain product/script snapshots;
  human review states are pending, approved, rejected. Editing a product resets
  matching-link approvals to pending. Approved does not mean posted or verified
  by an external source. Review facts, disclosure and media rights manually.
- Script templates and ChatGPT prompts are local deterministic text. User facts
  are explicitly unverified; no product attributes, sales, or experience are
  invented. Copying/opening ChatGPT is manual and subject to that service's terms.
- Malformed/unsafe persisted data stops writes. Preserve raw `aa_products` and
  `aa_queue_v1` with browser tools before repairing; never clear storage blindly.
  Export is blocked if data cannot be validated. There is no automatic migration.
- A changed storage baseline blocks writes until reload. Use a single tab; this
  optimistic check is not a cross-tab transaction. Storage quota errors are shown
  without committing the in-memory product change. Queue invalidation happens
  first when editing, so a failed save may conservatively reset review status.

## Security audit and changes

The original stored/imported URLs were not validated at render time, persistence
errors could look like validation failures, CSV cells could execute spreadsheet
formulas, empty script generation could crash, and service connection claims had
no evidence. The refactor uses strict data shapes and bounded inputs, validates
HTTPS Shopee hosts with no credentials/query/fragment, DOM textContent (no HTML
interpolation), safe external-link attributes, formula-neutralized CSV, guarded
storage writes and errors, and a CSP that denies network connections and inline
scripts. Data files cannot add arbitrary fields such as tokens. Do not put secrets
in names or facts: this tool cannot identify every secret in free-form text.
Some legitimate affiliate URLs containing queries are deliberately rejected;
keep an externally backed-up copy of legacy data before manually sanitizing it.

CSP in static HTML has browser limitations (frame-ancestors needs HTTP headers).
Local browser data can still be read by someone with device/origin access. No
claim of encryption, authentication or tamper-proof review history is made.

## Local Video Factory

```sh
python3 affiliate-autopilot/video/render.py --output /tmp/affiliate-example.mp4
# Optional font path (must support Thai and be licensed for your intended use):
python3 affiliate-autopilot/video/render.py --font /path/to/NotoSansThai-Regular.ttf --output /tmp/another-example.mp4
```

Install Python 3, FFmpeg with libass + libx264, ffprobe and a Thai font using your
OS's trusted package manager (Debian/Ubuntu packages: `ffmpeg fonts-noto-core`).
No pip dependencies, downloads at render time, GPU or API keys. A CPU with 2
threads, roughly 1 GB free RAM and 100 MB disk is a reasonable starting point;
actual performance varies. Local compute/electricity still has a cost. No paid
cloud compute is provisioned.

The prototype creates a six-second 720×1280 H.264/yuv420p MP4, 24 fps, no audio,
with burned-in Thai sample captions and affiliate disclosure. Output never
silently overwrites an existing file. It only renders a synthetic solid-color
background and fixed sample text; this is a smoke prototype, not an AI product
video generator. No remote images, copied product photos, music or voices are
used. To develop real product clips later, use user-owned or expressly licensed
assets, record source/license/permission, and manually verify every claim first.
Do not infer a license from public availability or scrape a store/platform.

The generated sample background/text are provided under CC0-1.0 by this
contribution. Noto fonts are distributed under SIL OFL 1.1; obtain the license
from the installed font package and retain applicable notices when distributing
fonts. Fonts and FFmpeg are not bundled. FFmpeg/libx264 licensing depends on the
build (often GPL); review your build's license and patent obligations before
redistributing a renderer or binary. Do not represent the sample as real footage.

## Supabase design — NOT deployed or tested against a project

`schema.sql` is a review-only design for a **new dedicated Affiliate project**.
No credentials, project URL or client SDK are present. It cannot run without an
explicit session review guard. The guard is a warning mechanism, not proof that
the selected database is safe. Never execute it in Jeerapan POS.

Future prerequisites: verify dedicated project reference and owner, current $0
plan/quotas and overage controls, disable paid upgrades, configure owner-only
Auth signup/access and redirect allowlists, then manually review/apply the SQL.
Client requests must use a signed-in owner JWT; never expose service-role keys.
RLS uses both USING and WITH CHECK owner conditions for updates; anon/public
receive no table privileges. Review UUID and URL constraints. This is a one-time
schema draft, not an idempotent migration runner. Queue sync is not implemented.

Before enabling any cloud adapter, run separate project tests with two users and
anon: owner CRUD succeeds; other-user select returns no rows and update/delete
cannot affect owner rows; cross-owner insert and changing owner_id fail; anon is
denied. Roll back fixtures. Those checks are **not run** here because no project
is provisioned. Free-plan availability is not verified; cloud remains disabled.
Publishing requires a separate authorized official integration and human test.
Shopee approval must be obtained normally; no bypass or scraping is provided.

## Validation evidence (2026-10-30)

- 4 Node model tests passed: legacy/import validation, URL security, CSV safety,
  disclosures/disabled flags, queue status constraints.
- 2 Chromium UI smoke tests passed: Pages subpath assets, product CRUD/export/
  import, text injection safety, prompts, manual review, 320px layout, malformed
  storage preservation and stale-tab write blocking.
- FFmpeg rendered `/tmp/affiliate-sample-66.mp4`; ffprobe confirmed H.264,
  720×1280, 6 seconds. Extracted frame was visually checked for Thai captions
  and disclosure. Output is local and not committed or published.
- Supabase RLS execution, live Pages deployment and official publishing tests
  are unrun. No unrelated app checks are needed for this standalone static path.
