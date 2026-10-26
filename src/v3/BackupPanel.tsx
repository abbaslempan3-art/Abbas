import { useState } from "react";
import { Download, Upload, ShieldCheck } from "lucide-react";
import {
  createBackup,
  hasPendingRestore,
  downloadJson,
  maxBackupBytes,
  parseBackup,
  previousSnapshot,
  restoreBackup,
  snapshot,
  summarizeStore,
  hasBackupData,
  planRestore,
  type Backup,
  type ActiveStores,
} from "./backup";
import { storeKeys, type StoreKey } from "./schema";
const summary = (key: StoreKey, value: unknown) =>
  Object.entries(summarizeStore(key, value))
    .map(([name, n]) => `${name}: ${n}`)
    .join(" · ") || "ไม่มีข้อมูล";
export function BackupPanel({ activeStores }: { activeStores: ActiveStores }) {
  const [preview, setPreview] = useState<Backup | null>(null);
  const [expected, setExpected] = useState<ReturnType<typeof snapshot> | null>(
    null,
  );
  const [merged, setMerged] = useState<Backup["stores"] | null>(null);
  const [prepared, setPrepared] = useState<{
    backup: Backup;
    raw: string;
    active: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const notify = (e: unknown) =>
    setMessage(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ");
  function presence(area: "localStorage" | "sessionStorage", key: StoreKey) {
    try {
      return window[area].getItem(key) === null ? "ไม่มีค่า" : "มีค่า";
    } catch {
      return "อ่านไม่ได้";
    }
  }
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">V3 · BACKUP & RECOVERY</span>
          <h2>ตรวจข้อมูลที่ใช้อยู่ ก่อนดาวน์โหลด Backup</h2>
          <p>
            สำรองบนเครื่อง ไม่มีการส่งไฟล์ขึ้น server และไม่เขียน localStorage
            ระหว่างการตรวจหรือส่งออก
          </p>
        </div>
        <ShieldCheck size={30} />
      </div>
      <article className="panel report-card">
        <h3>ตรวจแหล่งข้อมูลของแอปนี้</h3>
        <p className="muted">
          แอปใช้ React state แสดงผล และใช้ localStorage เมื่อบันทึก
          ข้อมูลตัวอย่าง 5 งานอาจยังอยู่ในหน่วยความจำโดยไม่มีค่าใน localStorage
          โค้ดนี้ไม่ได้ใช้ sessionStorage, IndexedDB หรือ API โหลดงาน
          หากพบสำเนาใน sessionStorage ระบบจะไม่รวมข้อมูลนั้นอัตโนมัติ
        </p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ส่วนข้อมูล</th>
                <th>localStorage</th>
                <th>sessionStorage (ไม่ได้ใช้แสดงผล)</th>
                <th>ข้อมูลที่แอปแสดงอยู่</th>
              </tr>
            </thead>
            <tbody>
              {storeKeys.map((k) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{presence("localStorage", k)}</td>
                  <td>{presence("sessionStorage", k)}</td>
                  <td>{summary(k, activeStores[k])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
      <div className="report-grid v3-spaced">
        <article className="panel report-card">
          <h3>สำรองข้อมูลทั้งหมด</h3>
          <p className="muted">
            ใช้ข้อมูลที่บันทึกใน localStorage ก่อน หากส่วนนั้นยังไม่มีค่า
            จะสำรอง React state ที่แสดงอยู่ รวมข้อมูลตัวอย่างที่ยังไม่บันทึก
            พร้อมระบุ sources ในไฟล์ หากข้อมูลเดิมเสียหายจะหยุด
            ไม่เอาข้อมูลตัวอย่างไปแทนโดยเงียบ ๆ ไฟล์ไม่เข้ารหัส ห้ามใส่ข้อมูลลับ
          </p>
          <button
            className="primary"
            onClick={() => {
              setPrepared(null);
              try {
                const backup = createBackup(localStorage, activeStores);
                setPrepared({
                  backup,
                  raw: JSON.stringify(snapshot(localStorage)),
                  active: JSON.stringify(activeStores),
                });
                setMessage(
                  "ตรวจข้อมูลผ่านแล้ว กรุณาตรวจจำนวนและแหล่งข้อมูลก่อนยืนยันดาวน์โหลด",
                );
              } catch (e) {
                notify(e);
              }
            }}
          >
            <Download size={15} />
            ตรวจสอบ Backup ก่อนดาวน์โหลด
          </button>
          <button
            className="secondary v3-spaced"
            onClick={() => {
              try {
                let sessionStores: ReturnType<typeof snapshot> | null = null;
                try {
                  sessionStores = snapshot(sessionStorage);
                } catch {
                  /* local raw copy remains available */
                }
                downloadJson(
                  {
                    format: "abbas-raw-recovery",
                    version: 1,
                    stores: snapshot(localStorage),
                    sessionStores,
                  },
                  "abbas-raw-recovery.json",
                );
                setMessage(
                  "สำรองข้อมูลดิบแล้ว ไฟล์นี้ไม่ใช่ Backup สำหรับกู้คืนอัตโนมัติ",
                );
              } catch (e) {
                notify(e);
              }
            }}
          >
            สำรองข้อมูลดิบกรณีอ่านไม่ได้
          </button>
        </article>
        <article className="panel report-card">
          <h3>สำเนาก่อนการกู้คืนครั้งล่าสุด</h3>
          <p className="muted">
            เก็บเพียงครั้งล่าสุดใน browser ควรดาวน์โหลดเก็บต่างหาก
            ไม่มีการล้างข้อมูลเมื่อส่งออก
          </p>
          <button
            className="secondary"
            onClick={() => {
              try {
                const before = previousSnapshot(localStorage);
                if (!before) throw Error("ยังไม่มีสำเนาก่อนกู้คืน");
                const backup = parseBackup(
                  JSON.stringify({
                    format: "abbas-backup",
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    stores: Object.fromEntries(
                      storeKeys.map((k) => [
                        k,
                        before[k] === null ? null : JSON.parse(before[k]!),
                      ]),
                    ),
                  }),
                );
                if (!hasBackupData(backup))
                  throw Error(
                    "สำเนาก่อนกู้คืนไม่มีรายการข้อมูล จึงไม่ดาวน์โหลดไฟล์ว่าง",
                  );
                downloadJson(backup, "abbas-before-restore.json");
                setMessage("ดาวน์โหลดสำเนาก่อนกู้คืนแล้ว");
              } catch (e) {
                notify(e);
              }
            }}
          >
            ดาวน์โหลดสำเนาก่อนกู้คืน
          </button>
        </article>
      </div>
      {prepared && (
        <article className="panel report-card v3-export-preview">
          <h3>สรุปข้อมูลก่อนดาวน์โหลด</h3>
          <p className="note">
            ข้อมูลจาก active-memory คือข้อมูลที่แอปกำลังแสดงและยังไม่บันทึก
            อาจเป็นข้อมูลตัวอย่างเริ่มต้น
            ไม่ใช่หลักฐานว่ามีข้อมูลลูกค้าหรือธุรกรรมจริง
            ไม่มีการบันทึกข้อมูลตัวอย่างลง localStorage อัตโนมัติ
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ส่วนข้อมูล</th>
                  <th>ต้นทางในไฟล์</th>
                  <th>รายการที่จะส่งออก</th>
                </tr>
              </thead>
              <tbody>
                {storeKeys.map((k) => (
                  <tr key={k}>
                    <td>{k}</td>
                    <td>{prepared.backup.sources?.[k]}</td>
                    <td>{summary(k, prepared.backup.stores[k])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            className="primary"
            onClick={() => {
              try {
                if (
                  JSON.stringify(snapshot(localStorage)) !== prepared.raw ||
                  JSON.stringify(activeStores) !== prepared.active
                ) {
                  setPrepared(null);
                  throw Error(
                    "ข้อมูลเปลี่ยนหลังตรวจ กรุณาเตรียม Backup ใหม่ก่อนดาวน์โหลด",
                  );
                }
                const checked = parseBackup(JSON.stringify(prepared.backup));
                if (!hasBackupData(checked))
                  throw Error("ไม่พบข้อมูลสำหรับสำรอง");
                downloadJson(
                  checked,
                  "abbas-backup-" +
                    new Date().toISOString().slice(0, 10) +
                    ".json",
                );
                setMessage("สร้างไฟล์สำรองที่ตรวจแล้ว กรุณาเก็บในที่ปลอดภัย");
              } catch (e) {
                notify(e);
              }
            }}
          >
            ยืนยันดาวน์โหลด Backup JSON
          </button>
        </article>
      )}
      <div className="panel inline-editor">
        <h3>ตรวจไฟล์ก่อนกู้คืนแบบเพิ่มข้อมูล</h3>
        <p className="note">
          กู้คืนแบบ <strong>เพิ่มรายการที่ยังไม่มีเท่านั้น</strong>{" "}
          ไม่ลบรายการเดิม ค่า null/ส่วนที่ว่างจะรักษาข้อมูลเดิม หาก ID
          หรือค่าที่มีอยู่ขัดแย้ง ระบบจะหยุดทั้งไฟล์ก่อนเขียน
          ไม่เขียนทับโดยอัตโนมัติ ใช้แท็บเดียวและดาวน์โหลด Backup
          ปัจจุบันก่อนยืนยัน
        </p>
        <label>
          ไฟล์สำรอง JSON
          <input
            aria-label="ไฟล์สำรอง JSON"
            type="file"
            accept="application/json,.json"
            disabled={busy || blocked}
            onChange={async (e) => {
              setPreview(null);
              setMerged(null);
              setExpected(null);
              setConfirmation("");
              setAgreed(false);
              setMessage("");
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > maxBackupBytes) {
                setMessage("ไฟล์ต้องไม่เกิน 5 MB");
                return;
              }
              setBusy(true);
              try {
                const candidate = parseBackup(await file.text());
                const current = snapshot(localStorage);
                const result = planRestore(candidate, current);
                setExpected(current);
                setMerged(result);
                setPreview(candidate);
                setMessage(
                  "ตรวจไฟล์ผ่านแล้ว ยังไม่เขียนข้อมูลจนกว่าจะยืนยันเพิ่มรายการ",
                );
              } catch (error) {
                notify(error);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {preview && expected && merged && (
          <div className="v3-restore-preview">
            <p>
              วันที่สำรอง:{" "}
              {new Date(preview.exportedAt).toLocaleString("th-TH")}
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>ส่วนข้อมูล</th>
                    <th>ข้อมูลปัจจุบันที่บันทึก</th>
                    <th>ในไฟล์</th>
                    <th>หลังเพิ่มข้อมูล</th>
                  </tr>
                </thead>
                <tbody>
                  {storeKeys.map((k) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>
                        {summary(
                          k,
                          expected[k] === null
                            ? null
                            : JSON.parse(expected[k]!),
                        )}
                      </td>
                      <td>
                        {preview.stores[k] === null
                          ? "ไม่ระบุ — รักษาข้อมูลเดิม"
                          : summary(k, preview.stores[k])}
                      </td>
                      <td>{summary(k, merged[k])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className="v3-agreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              ฉันตรวจไฟล์และยอมรับการเพิ่มรายการโดยไม่เขียนทับข้อมูลเดิม
            </label>
            <label>
              พิมพ์ กู้คืน เพื่อยืนยัน
              <input
                aria-label="คำยืนยันกู้คืน"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
              />
            </label>
            <button
              className="primary"
              disabled={!agreed || confirmation !== "กู้คืน" || busy || blocked}
              onClick={() => {
                setBusy(true);
                try {
                  const changed = restoreBackup(
                    localStorage,
                    preview,
                    expected,
                  );
                  if (changed) window.location.reload();
                  else {
                    setPreview(null);
                    setMessage(
                      "ข้อมูลในไฟล์มีอยู่แล้ว ไม่มีการเปลี่ยนแปลงข้อมูลเดิม",
                    );
                  }
                } catch (e) {
                  notify(e);
                  let pending = true;
                  try {
                    pending = hasPendingRestore(localStorage);
                  } catch {
                    /* startup guard will block unsafe recovery */
                  }
                  if (pending) {
                    window.location.reload();
                    return;
                  }
                  setBlocked(true);
                  setPreview(null);
                  setMessage(
                    (e instanceof Error ? e.message : "กู้คืนไม่สำเร็จ") +
                      " กรุณาโหลดใหม่เพื่อตรวจ recovery ก่อนทำงานต่อ",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              <Upload size={15} />
              ยืนยันกู้คืนข้อมูล
            </button>
          </div>
        )}
        {message && (
          <p role="status" className="note">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
