# แก้ไข ABBAS V3 Backup — สรุปสำหรับตรวจทาน

Branch: `fix/v3-backup-active-data` ต่อจาก V3 `4a639c8` ซึ่งยังไม่ merge main ณ เวลาตรวจ จึงเตรียม PR เข้าสู่ branch `feat/abbas-v3-command-center` เพื่อให้ตรวจเฉพาะ patch นี้ ไม่มีการ merge หรือ deploy production

## สาเหตุที่ทำซ้ำได้

1. `src/App.tsx` โหลดข้อมูลด้วย `useState(load)` ถ้า localStorage ยังไม่มี key จะคืน seed: 4 โครงการ, **5 งาน**, 3 ลูกค้าสมมติ
2. `useBusiness`, `useV2`, `useWorkspace` ก็มีค่าเริ่มต้นในหน่วยความจำ และเขียน localStorage เมื่อบันทึก/เปลี่ยนข้อมูลเท่านั้น
3. Backup รุ่นแรกอ่าน `localStorage.getItem()` อย่างเดียว ไม่ได้รับ state ที่แอปแสดง จึงสามารถแสดงงาน 5 รายการแต่ export `stores` เป็น null ทั้งหมดได้
4. หากเปิดคนละ domain/origin เช่น URL deployment V2 กับ V3 คนละ URL แต่ละ origin มี localStorage แยกกัน การไม่พบ key บน V3 ไม่ได้ยืนยันว่าข้อมูลที่สร้างไว้บน V2 หาย ห้ามล้าง storage หรือสร้างข้อมูลตัวอย่างทับ ต้องสำรองจาก origin เดิมก่อน
5. โค้ดแอปไม่ได้ใช้ sessionStorage, IndexedDB, Backend/API หรือฐานข้อมูลภายนอกเป็นแหล่งแสดงงาน มีการใช้ localStorage + React state เท่านั้น การวินิจฉัยนี้มาจาก source และ browser context จำลอง ไม่ใช่การเข้าถึงข้อมูลใน browser ส่วนตัวของผู้ใช้ ข้อมูลข้าม domain/origin ยังอ่านไม่ได้

## การแก้ไข

- App ส่ง active state ทั้ง 4 ส่วนให้ Backup โดยไม่ persist/reset/migrate ข้อมูลอัตโนมัติ
- Export เลือกข้อมูล localStorage ที่มีอยู่และผ่าน validation ก่อน; fallback ไป active state **เฉพาะเมื่อ key ไม่มีค่า** เมื่อ key มีข้อมูลเสียหายจะหยุดและให้ใช้ raw recovery ไม่ซ่อนปัญหาด้วย seed
- ส่ง `sources` metadata (`localStorage`, `active-memory`, `absent`) โดยคง backup format version 1 และ schema keys เดิม ไฟล์ V3 รุ่นเก่ายังตรวจรูปแบบได้
- แสดงจำนวน/แหล่งข้อมูลก่อนดาวน์โหลด ต้องยืนยันอีกครั้ง ตรวจ schema/size/safety และตรวจ stale snapshot ก่อนส่งไฟล์ ข้อมูลจาก memory อาจเป็นตัวอย่าง ไม่ใช่ข้อมูลลูกค้าจริง
- แสดง presence ของ keys ใน localStorage/sessionStorage และจำนวนที่แอปแสดง โดยไม่ dump ค่า/secret หรือสแกน keys ของระบบอื่น สำเนา session ไม่ถูกนำมาปนกับ app data; raw recovery มีสำเนาของ 4 keys ในทั้งสอง storage เพื่อวิเคราะห์ได้
- ไม่ดาวน์โหลด Backup ถ้าไม่มีรายการข้อมูล (รวม all-null หรือมีเพียง empty containers) ไม่เขียน storage ระหว่างเตรียม/ดาวน์โหลด

## กู้คืนโดยไม่ลบข้อมูลเดิม

- เปลี่ยนจาก replace เป็น **add-only merge**: เพิ่ม ID ใหม่/ค่า map ใหม่ รายการเดิมและ metadata ยังอยู่
- ถ้า ID เดิมมีเนื้อหาต่างกัน หรือ map key เดิมมีค่าต่างกัน จะ reject ทั้งไฟล์ก่อน journal/การเขียน ไม่ใช้ last-write-wins และไม่มีปุ่มบังคับ overwrite ใน patch นี้ ผู้ใช้ต้องตรวจความแตกต่างแยกต่างหาก
- ค่า null หรือส่วนว่างในไฟล์จะไม่ลบ/ลดรายการเดิม ไฟล์ที่ไม่มีข้อมูลทั้งหมดถูกปฏิเสธก่อนยืนยันกู้คืน
- Import ซ้ำที่มีข้อมูลเหมือนเดิมไม่เพิ่มซ้ำ ไม่เขียน journal หรือแก้ stores
- ก่อนเขียนยังเก็บ snapshot เดิมและ rollback/startup recovery ตาม V3 เดิม ต้องใช้แท็บเดียวเพราะ Local Storage ไม่ใช่ transactional database ข้ามแท็บ/อุปกรณ์
- ไม่มี `.clear()` หรือ reset localStorage ในเส้นทางแก้ไข การ rollback อาจ remove เฉพาะ key ที่เดิมไม่มีอยู่ เพื่อย้อนกลับการเขียนที่ล้มเหลว ไม่ใช่การลบข้อมูลเดิมของผู้ใช้

## ทดสอบ

- `npm ci --cache /tmp/abbas-npm`: ผ่าน lockfile เดิม ไม่มี dependency/service ใหม่
- `CHROMIUM_PATH=/usr/bin/chromium npm test`: 33 tests (เดิม 25 ปรับ expectation ของ UI/การกู้คืนให้ตรงกับความปลอดภัยใหม่ + เพิ่ม 8 regression tests)
- `npm run build`: ผ่าน TypeScript และ Vite ได้ dist
- ชุดใหม่ทำซ้ำหน้า 5 งานบน browser ว่าง ตรวจไฟล์ดาวน์โหลดจริงว่าไม่ใช่ null, ไม่เปลี่ยน local/session storage, persisted-first, round-trip ทั้ง 4 ส่วน, metadata, no-data, null/empty preservation, conflict ก่อนเขียน, repeat import, corrupt storage, stale export และ UI ปฏิเสธ all-null
- ชุดเดิมยังตรวจ quota/partial write/rollback/startup recovery และมือถือ

การทดสอบใช้ข้อมูลสมมติและ browser contexts แยก ไม่ได้แตะ localStorage ส่วนตัวของผู้ใช้ ไม่มี paid API, billing, merge หรือ production deployment

## วิธีตรวจด้วยตนเองก่อนอนุมัติ

1. เปิด Preview ของ branch นี้ ใช้ข้อมูลจำลองก่อน ไม่ใช้ข้อมูลร้านหรือลูกค้าจริง
2. ตรวจหน้า Backup: ถ้ายังไม่เคยบันทึก หน้า tasks แสดง 5 งาน แต่ localStorage ไม่มี key ให้เตรียม Backup และตรวจ source=active-memory พร้อม tasks:5
3. ยืนยันดาวน์โหลด เปิดไฟล์ดู tasks ครบ หากเพิ่ม/แก้ข้อมูลผ่านหน้าจอแล้ว source ของส่วนนั้นต้องเป็น localStorage
4. ทดลอง import ไฟล์ที่เพิ่ม ID ใหม่ ต้องเก็บรายการเดิมไว้ ไฟล์ all-null หรือ ID เดิมที่มีค่าต่างกันต้องหยุดโดยข้อมูลเดิมไม่เปลี่ยน
5. อ่านข้อจำกัดเรื่อง origin, ไฟล์ไม่เข้ารหัส และการใช้แท็บเดียว สำรอง raw data หากมี warning เรื่องข้อมูลเสียหาย ไม่ล้าง storage เพื่อแก้ปัญหา
