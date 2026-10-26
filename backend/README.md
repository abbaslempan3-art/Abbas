# Future integration boundary

นี่คือ development scaffold ไม่ใช่ backend production และ Frontend ยังไม่เรียก backend นี้ ไม่มีบัญชีผู้ใช้ OAuth, API key, token vault, provider adapters หรือ AI execution

```sh
npm run backend
npm run test:backend
```

Node.js 22+ ใช้ built-in HTTP server เปิดเฉพาะ `127.0.0.1:8787` เปลี่ยนพอร์ตด้วยตัวแปร `PORT` ที่ไม่ใช่ข้อมูลลับ ไม่รับหรือเก็บ credentials และไม่เรียกเครือข่ายภายนอก

| Endpoint                      | Current behavior                                  |
| ----------------------------- | ------------------------------------------------- |
| GET /api/health               | 200, mode=scaffold, OAuth/external calls disabled |
| GET /api/integrations         | 200, empty connections, connectedCount=0          |
| /api/oauth/:provider/start    | 501 NOT_IMPLEMENTED                               |
| /api/oauth/:provider/callback | 501 NOT_IMPLEMENTED                               |
| /api/workflows/execute        | 501 NOT_IMPLEMENTED                               |

## Architecture to implement before real integration

1. **Identity & sessions:** server-side user/tenant authorization, secure HttpOnly SameSite cookies, CSRF protection and explicit per-user consent. No token in URL or browser storage.
2. **Provider registry:** allowlist adapters with official provider documentation, availability, redirect URIs, minimal scopes and provider-specific capabilities. A directory listing does not imply that a provider supports OAuth or an execution API. Do not assume a consumer subscription includes API access.
3. **OAuth lifecycle:** validated state bound to user/session, one-time callback, PKCE where supported, nonce for OIDC, expiry/replay checks, revocation and refresh handling. Reject unknown providers and unapproved redirects. Store client secrets and encrypted refresh/access tokens in a server-side secret vault only; never use VITE_* for secrets.
4. **Connection verification:** backend checks provider permissions with an authorized read-only request and records verification timestamp and scope. UI may show connected only from a current successful verification. Current V1 has no verification mechanism or connected-state switch.
5. **Execution:** authorized server-side job queue with idempotency, retries, rate/budget limits, audit logs with redacted fields, per-tool approval, outbound domain allowlist, SSRF protection and explicit execution consent. Local simulations must never be auto-promoted to jobs.
6. **Persistence:** server database, validation, migrations, backups, tenant isolation and deletion policies. Never silently upload browser demo data or children/customer data. Add contract/integration tests per adapter before activation.

Scaffold is intentionally dependency-free. Do not expose it publicly until authentication, request limits, observability and deployment security are implemented. Website links and user-entered URL validation in Frontend are not SSRF defenses for a future server.
