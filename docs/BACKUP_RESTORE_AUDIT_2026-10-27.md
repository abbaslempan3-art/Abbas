# ผลตรวจ Backup / Restore ABBAS V3 ด้วยข้อมูลจำลอง

วันที่ทดสอบ: 27 ตุลาคม 2026 (Asia/Bangkok)

Source ที่ตรวจ: commit `e7dc814`, branch `fix/v3-backup-active-data`

## ขอบเขตความปลอดภัย

ใช้ `MemoryStorage` ที่เก็บใน JavaScript Map ใน process ทดสอบเท่านั้น ไม่ใช้ browser/page fixtures, persistent profile, localStorage/sessionStorage จริง, web server, API หรือ Vercel ไม่มีการแก้ source แอป เปิด Billing, commit/push, merge หรือ deploy ใด ๆ ในการตรวจรอบนี้

เพิ่มเฉพาะชุดทดสอบและ config สำหรับทำซ้ำ พร้อมรายงานผล ไม่มีการอ่านหรือแก้ข้อมูลส่วนตัวของผู้ใช้

## ผลการรันจริง

```sh
npm exec -- playwright test --config playwright.backup-audit.config.ts
```

เลือกเฉพาะ logic tests ของ Backup/Restore รวม **14 ผ่าน, 0 ล้มเหลว, 0 skipped, 0 flaky** ใน 1.6 วินาที ไม่ใช่การรัน UI/full application suite โดยมี 6 กรณีตรวจครบทุก namespace ที่เพิ่มรอบนี้ และ 8 กรณี regression เดิม

รายงานเครื่องอ่าน: `test-results/backup-audit-report.json`

## กู้คืนครบทั้ง 4 ส่วน

| ส่วน | ข้อมูลจำลองที่ตรวจ | ผล |
| --- | --- | --- |
| V1 | projects, tasks, customers, department, metadata และ task→project | ตรงต้นฉบับทุกฟิลด์หลัง serialize/export/import |
| Business | favorites, custom tools, monthly costs, income/expense, contents, workflows และ tool references | ครบ ยอดเงินทศนิยม/ID/ความสัมพันธ์ไม่เปลี่ยน |
| V2 | AI drafts, provider selection, account notes, trial date, monthly usage | ครบและตรงต้นฉบับ |
| V3 | CRM deal value, follow-up date/note, monthly budgets และ deal→customer | ครบและตรงต้นฉบับ |

ทดสอบกู้คืนลง mock ว่าง แล้ว deep-compare ทั้ง 4 objects กับ dataset ต้นฉบับโดยตรง ไม่ได้ตรวจเฉพาะจำนวนรายการ การ export ไม่เปลี่ยน source mock

## เพิ่มข้อมูลลงบนชุดเดิมโดยไม่ลบ

สร้างชุดเดิม `old` และชุดนำเข้า `new` แยก ID/เดือนงบ จากนั้นตรวจว่าทุกรายการเดิมรวม metadata ยังคงอยู่ และรายการนำเข้าครบ:

| หลังเพิ่มข้อมูล | จำนวนที่ตรวจได้ |
| --- | --- |
| Projects / Tasks / Customers | อย่างละ 2 |
| Custom tools / Costs | อย่างละ 2 |
| Favorites | 3 (มีรายการร่วม 1 รายการไม่ถูกเพิ่มซ้ำ) |
| Financial entries | 4 |
| Contents / Workflows | อย่างละ 2 |
| AI drafts / Account notes | อย่างละ 2 |
| CRM deals / Monthly budgets | อย่างละ 2 |

key ที่ไม่ใช่ของแอปยังคงค่าเดิม การกู้คืนไม่ได้ clear storage

## การนำเข้าซ้ำและกรณีผิดพลาด

- นำเข้า Backup เดิมซ้ำอีก **3 ครั้ง**: snapshot ทั้ง 4 ส่วนเหมือนเดิม ไม่มี ID/รายการซ้ำ ไม่เพิ่ม storage writes และ journal ไม่เปลี่ยน
- ทำให้ข้อมูลขัดแย้งใน **แต่ละส่วนทั้ง 4 ส่วน**: reject ก่อนเขียน ไม่มี store ใดเปลี่ยนและไม่สร้าง journal
- จำลอง write failure ใน **แต่ละส่วนทั้ง 4 ส่วน**: rollback คืน raw snapshot เดิมครบทุกส่วน รวม metadata และ unrelated key
- จำลอง interrupted restore โดยทำให้ทั้ง 4 ส่วนเป็นข้อมูลค้าง: startup recovery คืน snapshot เดิมครบ และเรียกซ้ำไม่ทำ recovery ซ้ำ
- Regression เดิมผ่าน: localStorage-first ผ่าน mock, null/empty sections รักษาของเดิม, ไฟล์ไม่มีข้อมูลถูกปฏิเสธ, ID/ยอดเงิน conflict ไม่เขียน, corrupt stored data ไม่ถูกกลบด้วย demo, schema/ขนาด/unsafe keys ถูกปฏิเสธ และ partial-write rollback

## ข้อจำกัดของข้อสรุป

ผลนี้ยืนยัน logic Backup/Restore บนข้อมูลจำลองครบทุกส่วน ไม่ใช่การตรวจข้อมูลใน browser จริงของผู้ใช้ ไม่ได้ทดสอบการคลิก UI หรือ Vercel ในรอบนี้ และไม่ใช่การอนุมัติใช้ production

Local Storage ข้ามแท็บ/อุปกรณ์ไม่มี transaction guarantee การใช้งานจริงยังควรใช้แท็บเดียว เก็บไฟล์สำรองนอก browser และตรวจไฟล์จาก origin เดิมในสภาพแวดล้อมทดสอบที่ได้รับอนุญาตก่อนเปิดเป็นระบบหลัก ไม่มีการ merge หรือ deploy production จนกว่าจะได้รับอนุมัติ
