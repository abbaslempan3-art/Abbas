/**
 * Public, read-only provider readiness endpoint for Vercel.
 * Intentionally does not inspect, expose or accept credentials.
 * No third-party API requests and no billing.
 */
const providers = Object.freeze([
  { id: "openai", name: "ChatGPT / OpenAI", type: "model", preferred: true },
  { id: "anthropic", name: "Claude", type: "model" },
  { id: "google", name: "Gemini", type: "model" },
  { id: "xai", name: "Grok", type: "model" },
  { id: "manus", name: "Manus", type: "agent" },
  { id: "github", name: "GitHub / Codex", type: "tool" },
  { id: "metricool", name: "Metricool", type: "tool" },
]);
export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ code: "METHOD_NOT_ALLOWED" });
  }
  return res.status(200).json({
    mode: "demo",
    liveModelEnabled: false,
    billingEnabledByThisApp: false,
    connectedCount: 0,
    providers: providers.map(p => ({
      ...p,
      status: "not_connected",
      accessPolicy: "existing-account-first; authorized free tier if available",
    })),
    note: "Consumer app subscriptions do not automatically grant API access. This endpoint is informational and makes no external calls.",
  });
}
