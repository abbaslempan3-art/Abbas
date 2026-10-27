import { timingSafeEqual } from "node:crypto";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }
  const expected = process.env.ABBAS_AI_ACCESS_TOKEN;
  if (!expected || expected.length < 24) {
    return res.status(503).json({ error: "ACCESS_NOT_CONFIGURED", message: "ยังไม่ได้ตั้งรหัสเข้าใช้งานบนเซิร์ฟเวอร์ค่ะ" });
  }
  const supplied = req.headers["x-abbas-access-token"];
  if (typeof supplied !== "string" || supplied.length !== expected.length ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "รหัสเข้าใช้งานไม่ถูกต้องค่ะ" });
  }
  return res.status(200).json({ ok: true });
}
