# รวม Backup fix สำหรับทดสอบ ABBAS V3

วันที่: 27 ตุลาคม 2026 (Asia/Bangkok)

## Branch และขอบเขต

- Branch ทดสอบ: `test/abbas-v3-backup-integration`
- ฐาน V3: `feat/abbas-v3-command-center` (`4a639c8`)
- Patch ที่นำเข้า: `fix/v3-backup-active-data` (`e7dc814`)
- Merge commit บน branch ทดสอบเท่านั้น: `381b2ef`
- PR target: `feat/abbas-v3-command-center` ไม่ใช่ main

รวมด้วย merge commit โดยไม่มี conflict และคงประวัติเดิมทั้งหมด Source แอป, package/lockfile และ vercel.json หลังรวมตรงกับ patch e7dc814 ไม่มีการแก้ข้อมูลผู้ใช้หรือเปลี่ยน migration เพิ่มเติม

นำชุดทดสอบ audit และรายงานเดิมที่เตรียมไว้เข้ามาด้วย เพื่อให้ผู้ตรวจทำซ้ำได้ ไม่เขียนทับ/ลบไฟล์เดิมที่ค้างอยู่ ไม่มีการ reset/clear localStorage จริง ไม่มี billing หรือ paid API ไม่มีการสั่ง merge main หรือ deploy/promote production

## พฤติกรรม Backup ที่รวมแล้ว

1. Export ใช้ localStorage ที่ถูกต้องก่อน และใช้ active React state เมื่อ key ยังไม่มีค่า พร้อมแสดงต้นทาง/จำนวนและให้ยืนยันก่อนดาวน์โหลด
2. กรณีข้อมูลเสียหายหรือไม่มีรายการ จะเตือน ไม่ส่งไฟล์ว่างแทนโดยเงียบ ๆ
3. Restore เป็น add-only merge รักษารายการและ metadata เดิม ไม่ใช้ null/ส่วนว่างลบข้อมูล
4. ID หรือค่าเดิมที่ขัดแย้งทำให้หยุดก่อนเขียน ไม่บังคับ overwrite
5. นำเข้าไฟล์ซ้ำไม่เกิด duplicate หรือเขียนข้อมูลเพิ่ม มี journal/rollback/startup recovery เมื่อเขียนล้มเหลว

## ผลตรวจรอบ integration

| คำสั่ง | ผล |
| --- | --- |
| `npm ci --cache /tmp/abbas-npm` | ผ่าน: 74 packages, dependency versions เดิม |
| `CI=true CHROMIUM_PATH=/usr/bin/chromium npm test` | ผ่าน 39 tests, ไม่มี failure |
| `npm run build` | ผ่าน TypeScript + Vite ได้ dist |
| `npm run test:backend` | ผ่าน 1 test, OAuth/execution ยังปิด |
| `npm exec -- playwright test --config playwright.backup-audit.config.ts` | ชุด audit 14 กรณีแบบ memory-only สำหรับทำซ้ำแยกจาก UI |
| `git diff --check` | ผ่าน |

39 tests รวม regression V1/V2/V3, Backup fix และ audit ที่ครอบคลุมทุกฟิลด์ของทั้ง 4 namespaces, ความสัมพันธ์ ID/metadata, import ซ้ำ, conflict, quota failures, rollback, startup recovery, UI upload/download/confirmation และมือถือ

การทดสอบหน้าเว็บใช้ localhost กับ Playwright contexts ใหม่และข้อมูลจำลอง ไม่เชื่อม profile/ข้อมูลจริงของผู้ใช้ ชุด memory-only ไม่เปิด browser หรือ server

## หยุดรออนุมัติ

งานนี้รวมโค้ดเฉพาะ branch ทดสอบและเตรียม PR เท่านั้น การทดสอบในเครื่องไม่ใช่หลักฐานว่า Vercel Preview ผ่าน ต้องตรวจ Preview ของ branch/commit ที่ถูกต้องภายหลังเมื่อเข้าถึงได้ และห้าม merge หรือ deploy production จนกว่าผู้ใช้อนุมัติ ไม่เปิดบริการเสียเงินหรือเปลี่ยนแพ็กเกจเพื่อแก้ access issue

รายละเอียดเพิ่มเติม: [BACKUP_FIX_REVIEW.md](BACKUP_FIX_REVIEW.md) และ [BACKUP_RESTORE_AUDIT_2026-10-27.md](BACKUP_RESTORE_AUDIT_2026-10-27.md)
