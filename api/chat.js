const MODEL = "gemini-2.5-flash";
const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.0-flash-lite"];
const MAX_BODY = 16000;
// Best-effort per-instance throttling. Serverless instances do not share memory;
// a durable edge/network rate limit is required before public release.
const windows = new Map();
function throttle(ip) {
  const now = Date.now();
  if (windows.size > 2000) {
    for (const [k, v] of windows) if (now - v.started > 60000) windows.delete(k);
    if (windows.size > 2000) windows.clear();
  }
  const entry = windows.get(ip);
  if (!entry || now - entry.started >= 60000) {
    windows.set(ip, { started: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > 5;
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "METHOD_NOT_ALLOWED" }); }
  // Server-side access gate; deny all calls until explicitly configured.
  const accessToken = process.env.ABBAS_AI_ACCESS_TOKEN;
  if (!accessToken || accessToken.length < 24) return res.status(503).json({ error: "ACCESS_NOT_CONFIGURED", message: "ยังไม่ได้ตั้งรหัสเข้าใช้งาน Abbas AI บนเซิร์ฟเวอร์ค่ะ" });
  const supplied = req.headers["x-abbas-access-token"];
  if (typeof supplied !== "string" || supplied.length !== accessToken.length) return res.status(401).json({ error: "UNAUTHORIZED", message: "กรุณาใส่รหัสเข้าใช้งาน Abbas AI ที่ถูกต้องค่ะ" });
  const { timingSafeEqual } = await import("node:crypto");
  if (!timingSafeEqual(Buffer.from(supplied), Buffer.from(accessToken))) return res.status(401).json({ error: "UNAUTHORIZED", message: "รหัสเข้าใช้งานไม่ถูกต้องค่ะ" });
  // Trust the platform-provided client address rather than the leftmost forwarded value.
  const forwarded = req.headers["x-forwarded-for"];
  const ip = (typeof forwarded === "string" ? forwarded.split(",").at(-1) : req.socket?.remoteAddress || "unknown").trim();
  if (throttle(ip)) return res.status(429).json({ error: "RATE_LIMITED", message: "ส่งข้อความถี่เกินไปค่ะ กรุณารอสักครู่" });
  // Claude is opt-in. Keep Gemini working until the owner configures a
  // separate Anthropic API key and explicitly selects the Claude provider.
  if (process.env.ABBAS_AI_PROVIDER === "claude") {
    const claudeKey = process.env.ANTHROPIC_API_KEY;
    if (!claudeKey) return res.status(503).json({
      error: "CLAUDE_NOT_CONFIGURED",
      message: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY ใน Vercel ค่ะ"
    });
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const messages = body?.messages;
      if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
        messages.some(m => !m || !["user", "assistant"].includes(m.role) ||
          typeof m.text !== "string" || !m.text.trim() || m.text.length > 3000) ||
        JSON.stringify(messages).length > MAX_BODY)
        return res.status(400).json({ error: "INVALID_MESSAGES" });
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: {
          "Content-Type": "application/json",
          "x-api-key": claudeKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5",
          max_tokens: 700,
          system: "คุณคืออามีน่า ผู้ช่วย AI ของ Abbas AI ตอบภาษาไทยสุภาพ กระชับ เรียกผู้ใช้ว่าเจ้านายเมื่อเหมาะสม ห้ามอ้างว่าเชื่อมต่อเครื่องมือหรือทำงานจริงโดยไม่ได้ทำ",
          messages: messages.map(m => ({ role: m.role, content: m.text }))
        })
      });
      if (!response.ok) {
        if (response.status === 429) return res.status(429).json({
          error: "CLAUDE_RATE_LIMIT", message: "Claude จำกัดการใช้งานชั่วคราวค่ะ (429)"
        });
        if (response.status === 401 || response.status === 403) return res.status(502).json({
          error: "CLAUDE_AUTH", message: "Claude ไม่ยอมรับ API Key หรือสิทธิ์ใช้งานค่ะ (" + response.status + ")"
        });
        if (response.status === 402) return res.status(502).json({
          error: "CLAUDE_CREDITS", message: "เครดิต Claude API ไม่เพียงพอค่ะ (402)"
        });
        if (response.status === 404) return res.status(502).json({
          error: "CLAUDE_MODEL", message: "Claude ไม่พบโมเดลที่ตั้งค่าไว้ค่ะ (404)"
        });
        return res.status(502).json({
          error: "CLAUDE_PROVIDER_ERROR", message: "Claude ตอบกลับด้วยสถานะ " + response.status + " ค่ะ"
        });
      }
      const data = await response.json();
      const reply = Array.isArray(data.content) ? data.content
        .filter(part => part.type === "text" && typeof part.text === "string")
        .map(part => part.text).join("").trim() : "";
      if (!reply) return res.status(502).json({
        error: "CLAUDE_EMPTY_RESPONSE", message: "Claude ยังไม่ส่งคำตอบกลับมาค่ะ"
      });
      return res.status(200).json({ text: reply, provider: "claude" });
    } catch {
      return res.status(504).json({
        error: "CLAUDE_REQUEST_FAILED", message: "เชื่อมต่อ Claude ไม่สำเร็จค่ะ"
      });
    }
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: "AI_NOT_CONFIGURED", message: "ยังไม่ได้ตั้งค่า Gemini API Key บนเซิร์ฟเวอร์ค่ะ" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const messages = body?.messages;
    if (!Array.isArray(messages) || messages.length < 1 || messages.length > 20 ||
      messages.some(m => !m || !["user","assistant"].includes(m.role) || typeof m.text !== "string" || !m.text.trim() || m.text.length > 3000) ||
      JSON.stringify(messages).length > MAX_BODY) return res.status(400).json({ error: "INVALID_MESSAGES" });
    const contents = messages.map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.text }] }));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 18000);
    let response;
    try {
      response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent", {
        method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", "x-goog-api-key": key },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: "คุณคืออามีน่า ผู้ช่วย AI ของ Abbas AI ตอบเป็นภาษาไทย สุภาพ กระชับ ใช้คำลงท้ายค่ะ และเรียกผู้ใช้ว่าเจ้านายเมื่อเหมาะสม ห้ามอ้างว่าได้ทำงานในระบบหรือเชื่อมต่อเครื่องมือใด ๆ หากไม่ได้ทำจริง ห้ามแต่งข้อมูลลูกค้าหรืองานที่ไม่ได้รับมา" }] },
          contents, generationConfig: { maxOutputTokens: 700, temperature: 0.6 }
        })
      });
    } finally { clearTimeout(timer); }
    // Discover models exposed to this API key and try each eligible text Flash
    // model on a model-not-found response. Never log keys or provider bodies.
    let modelDiagnostic = "MODEL_NOT_AVAILABLE";
    if (response.status === 404) {
      try {
        const listResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", {
          headers: { "x-goog-api-key": key }, signal: AbortSignal.timeout(5000)
        });
        if (!listResponse.ok) {
          modelDiagnostic = "MODEL_LIST_HTTP_" + listResponse.status;
        } else {
          const catalog = await listResponse.json();
          const available = (catalog.models || [])
            .filter(m => typeof m.name === "string" &&
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.startsWith("models/") ? m.name.slice(7) : m.name)
            .filter(name => /^gemini-/i.test(name) && /flash/i.test(name) &&
              !/image|tts|audio|live/i.test(name) && name !== MODEL);
          const prioritized = [
            ...FALLBACK_MODELS.filter(name => name !== MODEL && available.includes(name)),
            ...available.filter(name => !FALLBACK_MODELS.includes(name)).sort().reverse()
          ];
          modelDiagnostic = prioritized.length ? "FALLBACK_REJECTED" : "NO_COMPATIBLE_MODEL";
          for (const candidate of prioritized.slice(0, 8)) {
            const attempt = await fetch(
              "https://generativelanguage.googleapis.com/v1beta/models/" +
                encodeURIComponent(candidate) + ":generateContent", {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-goog-api-key": key },
                signal: AbortSignal.timeout(12000),
                body: JSON.stringify({
                  systemInstruction: { parts: [{ text: "คุณคืออามีน่า ผู้ช่วย AI ของ Abbas AI ตอบเป็นภาษาไทย สุภาพ กระชับ เรียกผู้ใช้ว่าเจ้านายเมื่อเหมาะสม" }] },
                  contents, generationConfig: { maxOutputTokens: 700, temperature: 0.6 }
                })
              }
            );
            response = attempt;
            if (attempt.ok) { modelDiagnostic = "FALLBACK_SUCCEEDED"; break; }
            if (attempt.status !== 404) {
              modelDiagnostic = "FALLBACK_HTTP_" + attempt.status;
              break;
            }
          }
        }
      } catch {
        modelDiagnostic = "MODEL_DISCOVERY_OR_RETRY_FAILED";
      }
    }
    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ error: "QUOTA_EXCEEDED", message: "โควตา Gemini ชั่วคราวเต็มแล้วค่ะ ลองใหม่ภายหลัง" });
      if (response.status === 400) return res.status(502).json({ error: "GEMINI_BAD_REQUEST", message: "Gemini ไม่ยอมรับรูปแบบคำขอหรือการตั้งค่าโมเดลค่ะ (Google 400)" });
      if (response.status === 401) return res.status(502).json({ error: "GEMINI_INVALID_KEY", message: "Gemini ไม่ยอมรับ API Key ค่ะ กรุณาตรวจสอบ GEMINI_API_KEY ใน Vercel (Google 401)" });
      if (response.status === 403) return res.status(502).json({ error: "GEMINI_PERMISSION_DENIED", message: "Gemini ปฏิเสธสิทธิ์การใช้ API หรือโมเดลค่ะ (Google 403)" });
      if (response.status === 404) return res.status(502).json({ error: "GEMINI_MODEL_NOT_FOUND", diagnostic: modelDiagnostic, message: "Google 404: ไม่พบโมเดลที่ใช้ได้ค่ะ (รหัสตรวจสอบ: " + modelDiagnostic + ")" });
      if (response.status >= 500) return res.status(502).json({ error: "GEMINI_UPSTREAM_ERROR", message: "บริการ Gemini ขัดข้องชั่วคราวค่ะ (Google " + response.status + ")" });
      return res.status(502).json({ error: "PROVIDER_UNAVAILABLE", message: "Gemini ตอบกลับด้วยสถานะ " + response.status + " กรุณาตรวจสอบการตั้งค่า API ค่ะ" });
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.filter(p => typeof p.text === "string").map(p => p.text).join("").trim();
    if (!text) return res.status(502).json({ error: "EMPTY_RESPONSE", message: "Gemini ยังไม่ส่งคำตอบกลับมาค่ะ" });
    return res.status(200).json({ text, provider: "gemini" });
  } catch (e) {
    return res.status(e?.name === "AbortError" ? 504 : 500).json({ error: "AI_REQUEST_FAILED", message: "ขออภัยค่ะ ระบบ AI ยังตอบกลับไม่ได้ ลองอีกครั้งนะคะ" });
  }
}
