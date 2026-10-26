# ABBAS AI Command Center V2 — review

Base: `origin/main` at `5b2bb51` (includes the V1 app and Vercel configuration). Feature branch: `feat/abbas-v2-command-center`. Do not merge automatically.

## สิ่งที่ใช้งานได้จริง

1. ร่าง แก้ไข บันทึก ลบ คัดลอก และเปิดเว็บไซต์ AI เพื่อทำงานด้วยตนเองจาก Command Center รองรับผู้ช่วยหลักที่ร้องขอและเครื่องมืออื่นใน Directory
2. แบ่งฝ่ายธุรกิจและติดตามสถานะงานโดยใช้ records เดิม โครงการ ลูกค้า และข้อมูลธุรกิจ V1 ไม่ถูก migrate หรือ reset
3. Workflow เดิมยังสร้าง บันทึก เปิดแก้ไข และจำลองแผนได้ เพิ่มการ export แผน JSON แบบ draft-only โดยไม่รันงาน
4. Cost Control แสดงข้อเท็จจริงที่อ่านได้ แหล่งอ้างอิง วันที่ตรวจ และช่องบันทึก usage/วันทดลองด้วยตนเอง มีคำเตือนใกล้/เกินโควตาเฉพาะเมื่อมีตัวเลขผู้ให้บริการและตัวเลขผู้ใช้ครบ มีคำเตือนวันทดลองใกล้หมด/ผ่านไปตามวันที่กรอก
5. V2 แยก storage namespace มี write-error handling และป้องกันการเขียนทับข้อมูล V2 ที่อ่านไม่ได้หรือเปลี่ยนจากอีกแท็บ

## สิ่งที่ยังเป็นต้นแบบ / ข้อจำกัด

- ไม่มี AI adapter, OAuth session หรือ credentials จึงไม่มี AI ที่เชื่อมต่อจริง สถานะเว็บไซต์เป็น link-only และ execution เป็น unavailable โดยไม่เชื่อค่า connected จาก browser
- ร่างคำสั่ง/Workflow ไม่ได้ส่งระหว่าง AI ไม่ได้รับ AI output และไม่มี job queue ไฟล์ JSON เป็น design contract เท่านั้น `inputReference` เป็นลำดับอ้างอิงเชิงแผน ไม่มีการส่งต่อ output จริง
- Backend scaffold เดิมตอบ 501 สำหรับ OAuth และ execution Frontend ไม่ได้เรียก Backend ใน V2
- ราคาหรือโควตาไม่ใช่ live data อ่านหน้า GitHub Copilot ได้ 1 แหล่ง อีก 6 แหล่งถูกปฏิเสธโดย proxy จึงไม่เติมข้อมูลที่ไม่ยืนยัน ไม่พบวันหมดอายุทดลองรายบัญชีจากหน้าสาธารณะ ข้อมูลวันที่และ usage ที่กรอกเองไม่ยืนยันสิทธิ์จริง
- ไม่มี signup, credit card, billing activation, paid resource creation หรือ paid API calls ปุ่มเว็บไซต์เปิด public site เท่านั้น
- ยังเป็นข้อมูลทดลองใน browser ไม่เข้ารหัส ไม่มี login, backups, sync หรือ transaction lock ข้ามแท็บ การป้องกัน stale write ของ V2 ไม่ครอบคลุมการเขียน V1 พร้อมกันหลายแท็บที่เป็นข้อจำกัดเดิม
- V2 ไม่ล้างหรือเปลี่ยน keys V1 โดยอัตโนมัติ การแก้ไขงานจากหน้าธุรกิจเป็นการแก้ records V1 ที่ผู้ใช้เลือกเอง ข้อมูลเสียหายฝั่ง V1 ยังคงมีพฤติกรรม fallback เดิม จึงควรสำรองก่อนแก้ไขในกรณีที่มี warning

## การทดสอบ

- `npm ci --cache /tmp/abbas-npm`: ผ่าน จาก lockfile เดิม ไม่มี dependency/service ใหม่
- `CHROMIUM_PATH=/usr/bin/chromium npm test`: 17 tests passed (V1 regression 9 + V2 8)
- `npm run build`: ผ่าน TypeScript และ Vite ได้ `dist` ตาม `vercel.json`
- `npm run test:backend`: 1 test passed (existing scaffold remains disabled)
- V2 mobile checks: 390 และ 320 พิกเซล Command Center, งานธุรกิจ, Cost Control, Workflow ไม่ล้นออกนอก viewport

## แผนงานถัดไป

1. Review และ merge PR เมื่ออนุมัติ จากนั้นใช้ Vercel deployment ของ main ตามคู่มือเดิม ไม่ได้ deploy production อัตโนมัติในงานนี้
2. เปิดสิทธิ์อ่านเอกสารผู้ให้บริการเพื่อยืนยันแผนและข้อจำกัดอีก 6 รายการ โดยไม่ login/สมัครหรือเปิด billing ตรวจ source และวันที่อีกครั้งก่อนใช้งานจริง
3. หากต้องการ AI execution ให้เลือก provider และขอบเขตที่อนุมัติก่อน พัฒนา server-side adapter ตามเอกสารจริง พร้อม authorization, consent, vault, current connection verification, quota/budget limits และ tests ห้ามเอา API keys มาไว้ใน Frontend/Local Storage
4. เพิ่มฐานข้อมูล การสำรอง และสิทธิ์ผู้ใช้ก่อนใช้ข้อมูลธุรกิจจริง สถานะ connected ต้องมาจากการทดสอบกับ backend/provider สำเร็จและยังไม่หมดอายุ
