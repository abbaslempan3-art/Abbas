# ABBAS AI V4 — Secure AI Gateway plan

## Current state
The V4 chat page is a local-only prototype. It does **not** call OpenAI, Anthropic, Google, xAI, Manus or any third-party model. Existing V3 data stays in browser localStorage. No customer data should be sent to a model without the owner's explicit approval.

## Target architecture
Browser chat -> authenticated same-origin backend -> policy/approval layer -> provider adapter -> model API -> response to browser.

The browser must **never** contain API keys. Secrets belong in backend environment variables. Never commit keys, copy them into Vite `VITE_*` variables, or include them in client bundles.

## Provider adapters (planned; not connected)
- OpenAI: default chat model, after separate API account and budget approval.
- Anthropic Claude: optional second opinion / long-document and coding tasks, after access approval.
- Google Gemini: optional analysis, after access approval.
- xAI Grok: optional provider, after access approval.
- Manus: only if a supported, authorized integration is available.
- GitHub / Codex and Metricool: external *tools*, not interchangeable language models. Use existing authorized connectors or separate supported APIs, with explicit approval for changes.

## Before enabling live model requests
1. Require server-side authentication and per-user authorization.
2. Add per-request and daily spending limits; default to zero requests and zero spend until owner authorizes billing.
3. Enforce provider allowlist; reject unknown provider/model identifiers.
4. Add strict server-side input validation, timeout, rate limiting and minimal redacted logs.
5. Confirm privacy policy and retention before sending personal/customer data to external AI.
6. Require a human approval checkpoint for sending messages, publishing, deleting, editing production, or spending money.
7. Provide a clear error message and safe fallback if a provider is unavailable.
8. Add integration tests with mocked adapters; never call paid endpoints in CI.
9. Preserve the V3 backup/restore workflow and verify that existing local data remains unchanged.

## Acceptance criteria for the next implementation
- A working backend `POST /api/chat` using an approved provider and server-only secrets.
- Provider adapter interface supports OpenAI, Claude, Gemini, Grok without pretending they are active.
- A visibly labeled offline/demo mode remains available.
- Real chat conversation history persists only with an explicit privacy and storage design.
- No paid API calls, subscriptions or billing enabled without owner consent.

## Deployment
Do not merge this design or any gateway implementation into production without review, a passing build, and a safe preview. This document does not activate a paid service.
