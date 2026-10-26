# ABBAS V3 — review and release gate

Branch: `feat/abbas-v3-command-center` · Base: main `752d419` (V2 merged). No automatic merge or production deployment.

## สิ่งที่ทำได้จริง

- หน้าทำงาน V3 ใช้ tasks, customers, finance entries และ AI tools เดิม ไม่สร้างฐานข้อมูลสำเนาของ V1/V2
- ค้นหา/เรียงงานค้างตามกำหนด แสดงงานถึงกำหนดและเลยกำหนด เพิ่มงานผ่านฟอร์มเดิม
- งบรายเดือนและเตือนรายจ่ายเกินงบ คำนวณจากรายการเงินตัวอย่างเดิม ไม่แตะข้อมูลธนาคารหรือระบบบัญชี
- ติดตามดีล CRM ด้วยมูลค่า วันติดตาม และบันทึก พร้อมเปลี่ยนสถานะ CRM เดิม ค่าโอกาสขายไม่ใช่รายรับ
- AI Brief สร้างร่างใน Command Center V2 ไม่มีการเรียก AI, ส่งข้อความให้ผู้ให้บริการ, สมัครแพ็กเกจ หรือเปิด billing
- สำรอง/ตรวจไฟล์/กู้คืน JSON 4 namespaces พร้อม explicit confirmation และ pre-restore snapshot ดิบ (แก้เป็น add-only merge ตาม BACKUP_FIX_REVIEW.md แล้ว) ไม่มีการอัปโหลดไป cloud
- ตรวจ startup recovery ก่อน mount stores ป้องกันการทำงานต่อกับชุดข้อมูลกู้คืนที่ยังไม่ครบ หาก recovery ล้มเหลวให้หยุดการแก้ไขและดาวน์โหลดข้อมูลดิบฉุกเฉินได้

## การรักษาข้อมูลและข้อจำกัดสำคัญ

- เพิ่ม `abbas-workspace-v3` สำหรับ budgets/deals เท่านั้น คง keys และ version ของ V1, Business และ V2 การเปิดหน้า V3 ไม่เปลี่ยน records เดิม
- การเปลี่ยนสถานะ CRM/เพิ่มงานเป็นการแก้ไขข้อมูลเดิมตามที่ผู้ใช้เลือกเอง ไม่มีการ migrate/reset อัตโนมัติ Notes ของลูกค้าที่ถูกลบยังอยู่ใน backup ของ V3 แต่ไม่แสดงเป็นลูกค้าปัจจุบัน
- Backup format = `abbas-backup`, version 1, stores ครบทั้ง 4 keys; แต่ละส่วนเป็น object ที่ตรง schema หรือ null ฟิลด์ metadata ที่ปลอดภัยของ records เดิมถูกเก็บไว้ ข้อมูลที่ยังไม่บันทึกใช้ active React state พร้อมระบุ sources; ข้อมูลที่มี localStorage ถูกต้องใช้ก่อน ต้องตรวจ preview ก่อนดาวน์โหลด
- Restore ปัจจุบันเป็น add-only merge: ต้องอ่าน preview ยืนยัน checkbox และพิมพ์ กู้คืน ค่า null/ส่วนว่างเก็บข้อมูลเดิมไว้ ไม่มีการลบ key เพื่อ import ถ้า ID เดิมหรือค่าที่มีอยู่ต่างกันจะหยุดก่อนเขียน ไม่เปลี่ยน keys อื่นใน origin
- ปฏิเสธ JSON ผิดรูปแบบ/เวอร์ชันที่ไม่รองรับ ขนาดเกิน 5 MB, โครงสร้างซ้อนลึก, ID ซ้ำ, unsafe custom-tool URLs และ key ที่เป็น secrets/prototype pollution ไม่โหลดโค้ดจากไฟล์
- เขียน durable journal ก่อนแก้ 4 stores ถ้าพื้นที่ไม่พอเก็บสำเนา จะไม่เริ่มเปลี่ยน stores หากผิดพลาดระหว่างเขียนจะ rollback คง journal หาก rollback ไม่ครบ และบังคับให้ startup ตรวจ recovery ก่อนแก้ข้อมูลต่อ
- ตรวจ stale snapshot ก่อน restore แต่ Local Storage ไม่ใช่ transactional database จึงต้องปิดแท็บอื่นก่อน ไม่มีการรับรอง atomicity หาก browser/เครื่องล้มเหลวขณะบันทึกจริง สำรองนอก browser เสมอ
- Journal เก็บ snapshot ก่อนกู้คืนเฉพาะครั้งล่าสุด ไม่รวมอยู่ใน backup ปกติเพื่อไม่สำรองซ้ำแบบวน ข้อมูลดิบ `abbas-raw-recovery` ใช้ตรวจซ่อม ไม่ใช่ไฟล์ import อัตโนมัติ
- ไม่มี login/encryption/server backups หรือการซิงก์ข้าม origin ข้อมูลใน V2 URL ของผู้ใช้ไม่สามารถอ่านจากแอปบน domain อื่นได้ ต้อง export/import ด้วยตนเอง
- V1/V2 ข้อจำกัดเดิมด้านการทำงานหลายแท็บยังมีอยู่ ไม่มี AI เชื่อมต่อจริง และ Backend scaffold ยังตอบ 501 สำหรับ OAuth/execution

## การทดสอบ

- `npm ci --cache /tmp/abbas-npm`
- `CHROMIUM_PATH=/usr/bin/chromium npm test` — เดิม 25 tests; หลังแก้ Backup รวม 33 tests ดู BACKUP_FIX_REVIEW.md
- `npm run build` — TypeScript + Vite, output `dist`
- `npm run test:backend` — 1 existing scaffold test
- V3 tests ครอบคลุม round-trip metadata, invalid/schema/duplicate/unsafe/oversized backup, stale restore, quota failures before/after journal, rollback, interrupted startup recovery, emergency read-only state, actual file upload/download/confirmation, finance/CRM/AI drafts, และมือถือ 390/320 พิกเซล

## Vercel Preview — ยังเป็น release gate

V2 reference URL ที่ผู้ใช้ให้:
https://project-y4m3c-ghcp113hm-abbaslempan3-art.vercel.app

คำขออ่านจาก cloud นี้ถูก proxy ปฏิเสธด้วย `CONNECT tunnel failed, response 403` (ไม่ได้รับ HTTP response จากตัวแอป) จึงยังยืนยันไม่ได้ว่าเว็บ V2 ใช้งานได้/เสีย และ URL นี้ไม่ใช่หลักฐานของ Preview V3

ไม่พบ Vercel connector, CLI binding หรือ credential ที่พร้อมใช้ใน session นี้ ไม่ได้ติดตั้ง/ล็อกอินหรือสร้างโครงการและทรัพยากรใหม่ ไม่มีการอ้างว่า local `npm run preview` เป็น Vercel Preview จริง

หลัง push/เปิด PR ให้ตรวจ Git integration ของ Vercel เดิมว่ามี Preview ของ branch `feat/abbas-v3-command-center` ที่ commit ล่าสุด โดยใช้แพ็กเกจเดิมที่ไม่มีค่าใช้จ่าย หากถูกขอเพิ่มบัตร อัปเกรด หรือเปิด billing ให้หยุด ไม่ดำเนินการต่อ

ก่อนอนุมัติ merge ต้องทดสอบ Preview URL จริง: Ready, commit/branch ถูกต้อง, หน้า V1/V2, งบ/CRM/AI Brief, export/import ข้อมูลสมมติใน browser แยกสำหรับทดสอบ และมือถือ ข้อมูลบน production/origin เดิมต้องไม่ถูกแก้ไข ส่ง URL Preview มาให้ตรวจซ้ำเมื่อเข้าถึงได้ ห้าม promote/deploy production จนกว่าผู้ใช้อนุมัติ
