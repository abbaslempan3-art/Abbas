# ABBAS AI V4 — account-first activation checklist

The live website is currently a local-demo assistant, not a multi-model AI. The new GET /api/providers endpoint is read-only and returns **not_connected** for every provider. It makes no external requests and accepts no credentials.

## Rules
- First prefer existing authorized accounts and official integrations. A ChatGPT Plus or Claude consumer subscription does not itself include API access to a custom website.
- If the owner has no account, consider an official free tier only where available; check terms, quota and regional availability at setup time. Do not silently register accounts.
- Never ask the owner to paste passwords, session cookies or API keys into the chat UI.
- Use server-side secrets and explicit per-provider consent when real integration is implemented.
- No auto-billing, paid subscriptions or model requests without the owner's separate approval.
- GitHub, Codex and Metricool are tools/integrations; they are not general model adapters.
- Keep customer CRM records local unless the owner authorizes specific data transfers.
- Any action that sends messages, changes business records, publishes content or deploys production must require confirmation.

## Next engineering milestone
Implement authenticated /api/chat with a provider adapter behind a disabled-by-default feature flag, mocked tests, rate limiting, and clear errors. Enable real provider calls only after supported credentials and owner consent are configured.

## Verification
GET /api/providers should return mode=demo, liveModelEnabled=false and connectedCount=0. Non-GET requests should return 405. This feature does not change the conversation UI.
