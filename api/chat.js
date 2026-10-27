const MODEL = "gemini-2.5-flash";
const MAX_BODY = 16000;
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
    if (!response.ok) {
      if (response.status === 429) return res.status(429).json({ error: "QUOTA_EXCEEDED", message: "โควตา Gemini ชั่วคราวเต็มแล้วค่ะ ลองใหม่ภายหลัง" });
      if (response.status === 400 || response.status === 403) return res.status(502).json({ error: "PROVIDER_REJECTED", message: "Gemini ปฏิเสธคำขอ กรุณาตรวจสอบสิทธิ์ API และโมเดลค่ะ" });
      return res.status(502).json({ error: "PROVIDER_UNAVAILABLE", message: "ติดต่อ Gemini ไม่สำเร็จค่ะ" });
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.filter(p => typeof p.text === "string").map(p => p.text).join("").trim();
    if (!text) return res.status(502).json({ error: "EMPTY_RESPONSE", message: "Gemini ยังไม่ส่งคำตอบกลับมาค่ะ" });
    return res.status(200).json({ text, provider: "gemini" });
  } catch (e) {
    return res.status(e?.name === "AbortError" ? 504 : 500).json({ error: "AI_REQUEST_FAILED", message: "ขออภัยค่ะ ระบบ AI ยังตอบกลับไม่ได้ ลองอีกครั้งนะคะ" });
  }
}
