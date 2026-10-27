# ABBAS AI V4 — Account-first provider policy

Owner preference: use existing accounts first; for services without an account, use a free tier only if it is available and permitted.

## Important distinction
Having a ChatGPT Plus, Claude Pro, Gemini, Grok, or other consumer app subscription does **not** automatically grant the ABBAS AI website access to the corresponding model API. Never ask for or store consumer account passwords in the app. Use official OAuth / connector flows when supported, or an authorized API with explicit cost approval. No login scraping, browser session hijacking, unofficial proxying, or bypass of plan limits.

## Connection order
1. Check which providers the owner has authorized and whether a supported connector/OAuth integration is available.
2. For services without accounts, check publicly documented free tiers and restrictions; do not auto-register or activate billing.
3. Keep unavailable providers visibly marked **Not connected**, never imply the website is running them.
4. OpenAI is the planned primary model once a legitimate authorized integration is configured.
5. Claude, Gemini, Grok, Manus and other providers are optional; GitHub/Codex and Metricool are tools rather than interchangeable model providers.
6. Until then, the V4 website stays in clearly labeled local-demo mode and only reads existing task/CRM data in the user's browser.

## UX
One primary conversation composer; no clutter of provider-switching buttons. Route to connected providers automatically only after safe server-side implementation. Approval is required for messages to real customers, publication, deletion, payments, production changes and external sharing of private CRM records.

## No-cost guarantee
No API keys, paid calls, new subscriptions or billing changes in this design PR.
