# V2 provider information review

ตรวจวันที่ 26 ตุลาคม 2026 (Asia/Bangkok) โดยอ่านหน้า public ผ่าน HTTPS ไม่ใช้ login, API key หรือเปิด billing

## ข้อมูลที่ตรวจเนื้อหาได้

Source: https://github.com/features/copilot/plans (HTTP 200)

HTML SHA-256: `13fe985afc9a5bb1060768489125708846270812bc672ab4f80a43a2d09c7009`

ข้อความที่พบในหน้าผู้ให้บริการ:

> Pricing plans / Free / $0

> Inline suggestions / Free plan / 2,000 per month

> Free plan / Limited chat and agent usage

> GitHub Copilot Free users are limited to 2,000 completions and access to entry level models per month.

นำเฉพาะข้อมูลเหล่านี้มาแสดง ไม่อนุมานว่า API ฟรีหรือใช้ได้ตลอดไป ไม่ใช้ตัวเลข chat quota จากความจำ และไม่ถือว่า Free เป็น free trial ไม่พบวันหมดอายุรายบัญชีในแหล่งนี้ จึงให้ผู้ใช้บันทึกวันที่ที่ตรวจจากบัญชีเองโดยแยกจากข้อเท็จจริงผู้ให้บริการ

ข้อมูลเป็น snapshot ที่อาจเปลี่ยนได้ UI แสดงวันที่ตรวจ และเตือนให้ตรวจใหม่หลัง 30 วัน ไม่มีการดึงหน้าเว็บจาก frontend อัตโนมัติ ไม่มีการตรวจสิทธิ์หรือโควตาคงเหลือรายบัญชี

## แหล่งที่ยังไม่ยืนยันเนื้อหา

| Provider | Source                                       | Observed result                    |
| -------- | -------------------------------------------- | ---------------------------------- |
| ChatGPT  | https://openai.com/chatgpt/pricing/          | proxy denied; not content-verified |
| Gemini   | https://gemini.google/subscriptions/         | proxy denied; not content-verified |
| Claude   | https://claude.com/pricing                   | proxy denied; not content-verified |
| Grok     | https://x.ai/grok                            | proxy denied; not content-verified |
| Manus AI | https://manus.im/pricing                     | proxy denied; not content-verified |
| Codex    | https://developers.openai.com/codex/pricing/ | proxy denied; not content-verified |

รายการที่อ่านไม่ได้แสดงแผนฟรี ข้อจำกัด โควตา และระยะทดลองเป็น “ยังไม่ยืนยัน” ห้ามตีความเป็นฟรีหรือไม่มีข้อจำกัด ลิงก์เป็นแหล่งอ้างอิงที่ต้องเปิดตรวจใหม่เมื่อมีสิทธิ์เครือข่าย การถูกปฏิเสธไม่ใช่หลักฐานว่าบริการเสียหรือไม่ฟรี

ไม่มีการอ้างว่า AI ใดเชื่อมต่อจริง การเปิดเว็บไซต์และการตรวจข้อมูลแผนไม่ใช่การตรวจ API integration
