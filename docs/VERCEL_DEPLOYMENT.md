# Vercel Production Deployment — Abbas

## ผลตรวจ repository

ตรวจจาก `origin/main` ที่ commit `f0a8dcc` (merge PR #1) วันที่ 26 ตุลาคม 2026 ก่อนแยก branch `fix/vercel-production-deployment`

- `package.json` มี `build: tsc -b && vite build` และ dependencies/lockfile ของ React, Vite, TypeScript ครบ
- `npm ci` ผ่าน ไม่พบ lockfile mismatch
- `npm test` ผ่าน 9 ชุด (ใช้ Chromium ที่มีในเครื่องผ่าน `CHROMIUM_PATH=/usr/bin/chromium`)
- `npm run build` ผ่าน TypeScript และ Vite สร้าง `dist/index.html`, JS และ CSS ใน `dist/assets/`
- ตรวจ production bundle ด้วย `npm run preview`: HTML และ assets 2 ไฟล์ตอบ 200, React แสดงผลได้, ไม่มี browser page error และสถานะ AI ยังเป็นเชื่อมต่อจริง 0 รายการ
- Vite ใช้ default output เป็น `dist` และ base URL `/` เหมาะกับการ deploy ที่ root domain ไม่ต้องใช้ `src`, `public`, `build` หรือ `backend` เป็น Output Directory
- main เดิมไม่มี `vercel.json` การไม่มีไฟล์นี้เพียงอย่างเดียว **ไม่ใช่หลักฐานว่า deploy ไม่ได้** เพราะ Vercel รองรับการตรวจจับ Vite อัตโนมัติ
- ไม่พบ Vercel project binding หรือ credential ของ Vercel ใน environment ที่ให้มา ไม่ได้เข้าถึง Dashboard/Build Logs/การตั้งค่า production ของ Vercel จึงยังยืนยันสาเหตุของ “No Production Deployment” ฝั่งบริการไม่ได้
- GitHub deployment-history API ตอบ `Forbidden` จึงไม่สามารถใช้ข้อมูลนี้ยืนยันว่ามี/ไม่มี deployment จริง หรือตรวจ status checks บนบริการได้

## การแก้ไขใน PR

1. เพิ่ม `vercel.json` กำหนด `framework: vite`, `installCommand: npm ci`, `buildCommand: npm run build`, `outputDirectory: dist` ให้ใช้ workflow ที่ทดสอบแล้ว
2. กำหนด Node.js `24.x` ใน `package.json` และ root metadata ของ lockfile ให้ตรงกับ runtime ที่ทดสอบ ไม่เปลี่ยน dependency versions
3. Ignore `.vercel/` เพื่อไม่ commit local deployment metadata/output
4. เพิ่มคู่มือแยกการตรวจโค้ดออกจากการตั้งค่าโปรเจกต์ Vercel

ไม่มีการเปลี่ยน application logic หรือข้อความสถานะ AI ไม่มีการ deploy backend เพิ่ม API keys สมัครบริการเสียเงิน หรือเปลี่ยนแพ็กเกจ/บัตรเครดิต และยังไม่ merge PR โดยอัตโนมัติ

## ตั้งค่า Vercel หลังตรวจ PR

ใช้บัญชีและแพ็กเกจเดิมที่มีสิทธิ์ใช้งาน ห้ามเลือกขั้นตอนที่ต้องจ่ายเงินหรือเพิ่มบัตร หาก workspace/repository policy ไม่อนุญาตให้หยุดที่ข้อจำกัดนั้นก่อน

1. ตรวจ PR และ merge เข้า `main` ผ่าน GitHub หลังผู้รับผิดชอบอนุมัติ
2. เปิดโปรเจกต์ Vercel ที่ต้องการ ตรวจว่า Git integration เชื่อม `abbaslempan3-art/Abbas` จริง ถ้ายังไม่มีโปรเจกต์ ให้ import repository นี้ผ่านบัญชีที่เข้าถึง repository ได้ โดยไม่เลือก paid add-ons
3. ตรวจ Production Branch เป็น `main` (ตำแหน่งอาจอยู่ใน Git/Environments settings ตาม UI รุ่นปัจจุบัน) PR/feature branch จะได้ Preview ตามปกติ จึงยังไม่ถือเป็น Production
4. ตรวจ Root Directory เป็น **root ของ repository** (`.` หรือไม่กำหนด subdirectory) ไม่ใช่ `src/`, `dist/`, `backend/` หรือชื่อโฟลเดอร์ checkout `Abbas/` บน cloud นี้
5. Framework Preset = **Vite**, Node.js = **24.x** และไม่ตั้ง override ที่ขัดกับ `vercel.json`

   | Setting               | Value              |
   | --------------------- | ------------------ |
   | Install Command       | `npm ci`           |
   | Build Command         | `npm run build`    |
   | Output Directory      | `dist`             |
   | Environment Variables | ไม่จำเป็นสำหรับ V1 |

6. หลัง merge ให้ตรวจ Deployments: ต้องเป็น commit บน `main` และ target/environment **Production** ถ้า integration ไม่เริ่มงาน ให้ตรวจ GitHub App permission, repository access, automatic deploy settings/ignored build step, branch rules และสิทธิ์ผู้เขียน commit ตามข้อความที่ Vercel แสดง
7. ถ้ายังไม่เคยมี production สำเร็จ ให้เริ่ม deployment จาก commit บน `main` ผ่าน UI ที่มีให้ หรือเมื่อมี Preview สำเร็จให้ใช้ Promote to Production ถ้า Vercel แสดงตัวเลือกและผู้รับผิดชอบอนุมัติ อย่าใช้ Redeploy โดยสมมติว่า Preview จะเปลี่ยนเป็น Production เอง ให้ตรวจ target ทุกครั้ง
8. อ่าน Build Logs: ต้องเห็น install สำเร็จ, `tsc -b && vite build` สำเร็จ และ Vercel รับไฟล์จาก `dist` จากนั้นจึงตรวจว่า deployment มีสถานะ **Ready** และถูกกำหนดเป็น Production
9. เปิด URL production ที่ Vercel กำหนด ทดสอบหน้าแรก โครงการ/งาน Directory และรีโหลดข้อมูลตัวอย่าง ตรวจ browser console/asset requests ถ้าทดสอบบน origin ใหม่ Local Storage เดิมจะไม่ถูกย้ายตาม domain

### แยกอาการจากหลักฐาน

| อาการ                                 | สิ่งที่ควรตรวจต่อ                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| ไม่มี deployment attempt เลย          | Git integration, repository access, branch, automatic deployment/ignored build step และสิทธิ์บัญชี/ผู้เขียน commit |
| มีแต่ Preview                         | production branch และ target ของ deployment; merge PR ยังไม่เกิดหรือยังไม่ promote                                 |
| Build ล้มเหลว                         | อ่าน error แรกใน logs; ตรวจ root, Node 24.x, install/devDependencies และคำสั่ง build                               |
| Build ผ่านแต่หา output ไม่พบ          | Output Directory ต้องเป็น `dist` จาก root ที่มี `package.json`                                                     |
| Ready แต่ production domain ยังไม่ชี้ | ตรวจ deployment target/production assignment และ domain configuration; ไม่จำเป็นต้องซื้อ domain ใหม่               |
| API/backend ไม่ทำงาน                  | V1 deploy เฉพาะ frontend; `backend/` เป็น scaffold ไม่ได้เปิด OAuth/execution หรือ server บน Vercel                |

ไม่เพิ่ม SPA catch-all rewrite เพราะแอปปัจจุบันใช้เมนูจาก React state โดยไม่มี pathname routes หากเพิ่ม React Router ในอนาคต จึงค่อยเพิ่ม fallback พร้อมทดสอบไม่ให้กลบ asset/API 404

## ตรวจซ้ำในเครื่อง

```sh
node --version  # 24.x
npm ci
npx playwright install chromium
npm test
npm run build
npm run preview
```

บน Linux ที่มี Chromium แล้วใช้ `CHROMIUM_PATH=/usr/bin/chromium npm test` แทนได้ Playwright และ browser ใช้ตรวจใน development/CI ไม่ต้องติดตั้ง browser หรือรัน `npm test` ใน Vercel Build Command

ยังไม่ถือว่า production สำเร็จจนกว่าจะตรวจ deployment จริงใน Vercel ได้ การ build ผ่านใน cloud นี้ไม่ยืนยันสิทธิ์ Git integration, สถานะ Vercel หรือ production domain
