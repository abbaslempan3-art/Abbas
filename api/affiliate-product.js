// Server-side Firecrawl proxy for Affiliate AI. Deploy to a serverless host (e.g. Vercel).
// Set FIRECRAWL_API_KEY in the host's secret environment variables; never put it in client code.
const ORIGIN = "https://abbaslempan3-art.github.io";
const allowed = ["shopee.co.th", "s.shopee.co.th", "shope.ee", "shp.ee"];
function isShopeeLink(raw) {
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase();
    return u.protocol === "https:" && allowed.some(x => host === x || host.endsWith("." + x));
  } catch { return false; }
}
function safeHttps(raw) {
  try { const u = new URL(raw); return u.protocol === "https:" ? u.href : null; }
  catch { return null; }
}
function pickMedia(x) {
  if (typeof x === "string") return safeHttps(x);
  if (x && typeof x === "object") return safeHttps(x.url || x.src || "");
  return null;
}
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", ORIGIN);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const raw = typeof req.body === "string" ? (() => { try { return JSON.parse(req.body); } catch { return {}; } })() : req.body;
  const url = typeof raw?.url === "string" ? raw.url.trim() : "";
  if (!isShopeeLink(url) || url.length > 4096) return res.status(400).json({ error: "กรุณาระบุลิงก์ Shopee HTTPS ที่ถูกต้อง" });
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return res.status(503).json({ error: "ยังไม่ได้ตั้งค่า FIRECRAWL_API_KEY บนเซิร์ฟเวอร์" });
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 25000);
  try {
    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ url, formats: ["markdown", "images"], onlyMainContent: false }),
      signal: ctrl.signal
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.success) return res.status(502).json({ error: "Firecrawl ไม่สามารถอ่านหน้าสินค้านี้ได้", detail: payload.error || "Upstream unavailable" });
    const d = payload.data || {};
    const images = Array.isArray(d.images) ? [...new Set(d.images.map(pickMedia).filter(Boolean))].slice(0, 12) : [];
    const title = String(d.metadata?.title || d.title || "").slice(0, 400);
    const description = String(d.metadata?.description || d.description || "").slice(0, 2000);
    const video = pickMedia(d.metadata?.video || d.video);
    return res.status(200).json({ title, description, images, video, sourceUrl: url, videoAvailable: Boolean(video), note: "ข้อมูลสาธารณะที่อ่านได้จากหน้าสินค้า ไม่รับประกันข้อมูลครบถ้วน" });
  } catch (err) {
    return res.status(502).json({ error: err.name === "AbortError" ? "หมดเวลารอข้อมูลจาก Firecrawl" : "ไม่สามารถเชื่อมต่อ Firecrawl ได้" });
  } finally { clearTimeout(timer); }
}
