# Expand Abbas into an entrepreneur AI command center

Base: `main` · Head: `feat/entrepreneur-ai-command-center`

This branch includes the original V1 implementation, which has not been merged into main, and extends it without removing project, task, CRM or reporting capabilities.

## Result

- Thai responsive executive dashboard, CRM sales pipeline and optional project business classification.
- Extensible catalog of all 44 requested tools in six categories, with public website links, search, category/job/business filters, rule-based recommendations, favorites and user-defined monthly budgets in THB.
- Custom tool create/edit/delete with HTTPS and duplicate-name validation. Clearly distinguishes curated official links from user-specified websites.
- Demo income/expense CRUD with month/business filters and separate AI budget totals to prevent double counting.
- Content production board with CRUD, channel/date/tool planning, business filters and editable stages.
- Saved, editable and reorderable workflow plans with text-only simulation; no AI calls or fabricated execution results.
- Honest integration settings plus a dependency-free backend scaffold that returns 501 for unimplemented OAuth/workflow execution.
- Existing browser data retained under its original key; new business records use a separate versioned key with validation and visible storage errors.

## Validation

- `npm run build`: TypeScript and Vite production build passed.
- `CHROMIUM_PATH=/usr/bin/chromium npm test`: 9 Playwright tests passed, covering legacy CRUD, directory/catalog, favorites/budgets, custom URLs/tools, financial totals, sales stages, content plans, saved workflow simulation, mobile layouts, storage errors and absence of outbound application requests.
- `npm run test:backend`: 1 test passed across health, empty integrations, disabled OAuth/execution and unknown routes.
- Website review: GitHub Copilot HTTP 200; the other 43 destinations denied by the cloud proxy (403). They remain unverified; this does not establish broken URLs or working integrations. Full table in TOOL_URL_REVIEW.md.

## Boundaries

All records are fictional, local browser examples. No secrets, paid subscriptions, provider SDKs, live integrations or external AI execution were added. Budget values are user estimates, not fetched pricing. No authentication, sync, backups, accounting compliance or production backend is included. OAuth/provider support requires separate implementation and verification against official provider docs. Do not merge automatically.
