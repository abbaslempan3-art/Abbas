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
  type Backup,
} from "./backup";
import { storeKeys } from "./schema";
export function BackupPanel() {
  const [preview, setPreview] = useState<Backup | null>(null);
  const [expected, setExpected] = useState<ReturnType<typeof snapshot> | null>(
    null,
  );
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const notify = (e: unknown) =>
    setMessage(e instanceof Error ? e.message : "ดำเนินการไม่สำเร็จ");
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">V3 · BACKUP & RECOVERY</span>
          <h2>เก็บข้อมูลของคุณไว้ ก่อนเริ่มก้าวต่อไป</h2>
          <p>
            สำรอง JSON เฉพาะบนเครื่อง ไม่มีการส่งไฟล์ขึ้น server
            ข้อมูลไม่เข้ารหัสและต้องเก็บในที่ปลอดภัย
          </p>
        </div>
        <ShieldCheck size={30} />
      </div>
      <div className="report-grid">
        <article className="panel report-card">
          <h3>สำรองข้อมูลทั้งหมด</h3>
          <p className="muted">
            รวมข้อมูลที่บันทึกใน V1, Business, V2 และ V3 เฉพาะ browser/origin
            นี้ ข้อมูลตัวอย่างที่ยังไม่เคยบันทึกไม่อยู่ในไฟล์ ไม่รวมรหัสผ่านหรือ
            API keys และห้ามใส่ข้อมูลลับในแอป
          </p>
          <button
            className="primary"
            onClick={() => {
              try {
                downloadJson(
                  createBackup(localStorage),
                  "abbas-backup-" +
                    new Date().toISOString().slice(0, 10) +
                    ".json",
                );
                setMessage("สร้างไฟล์สำรองแล้ว กรุณาเก็บไฟล์ไว้ในที่ปลอดภัย");
              } catch (e) {
                notify(e);
              }
            }}
          >
            <Download size={15} />
            ดาวน์โหลด Backup JSON
          </button>
          <button
            className="secondary v3-spaced"
            onClick={() => {
              try {
                downloadJson(
                  {
                    format: "abbas-raw-recovery",
                    version: 1,
                    stores: snapshot(localStorage),
                  },
                  "abbas-raw-recovery.json",
                );
                setMessage(
                  "สำรองข้อมูลดิบแล้ว ไฟล์นี้ใช้ตรวจซ่อมข้อมูล ไม่ใช่ไฟล์สำหรับกู้คืนอัตโนมัติ",
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
            เก็บเฉพาะสำเนาครั้งล่าสุดใน browser
            สำเนาอาจสูญหายหากล้างข้อมูลเว็บไซต์ จึงควรดาวน์โหลดเก็บต่างหาก
          </p>
          <button
            className="secondary"
            onClick={() => {
              try {
                const before = previousSnapshot(localStorage);
                if (!before) throw Error("ยังไม่มีสำเนาก่อนกู้คืน");
                const stores = Object.fromEntries(
                  storeKeys.map((k) => [
                    k,
                    before[k] === null ? null : JSON.parse(before[k]!),
                  ]),
                );
                const backup = parseBackup(
                  JSON.stringify({
                    format: "abbas-backup",
                    version: 1,
                    exportedAt: new Date().toISOString(),
                    stores,
                  }),
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
      <div className="panel inline-editor">
        <h3>ตรวจไฟล์ก่อนกู้คืน</h3>
        <p className="note">
          การกู้คืนจะ <strong>แทนที่ข้อมูลทั้ง 4 ส่วน</strong> ด้วยไฟล์ที่เลือก
          ไม่ใช่การรวมรายการ ระบบจะเก็บสำเนาก่อนแก้ไขและพยายาม rollback
          หากเขียนไม่สำเร็จ ใช้เพียงแท็บเดียวระหว่างกู้คืน
          ปิดแท็บแอปอื่นและดาวน์โหลด backup ปัจจุบันก่อน
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
                setExpected(snapshot(localStorage));
                setPreview(candidate);
                setMessage("ตรวจไฟล์ผ่านแล้ว ยังไม่เขียนข้อมูลจนกว่าจะยืนยัน");
              } catch (error) {
                notify(error);
              } finally {
                setBusy(false);
              }
            }}
          />
        </label>
        {preview && (
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
                    <th>ข้อมูลในไฟล์</th>
                  </tr>
                </thead>
                <tbody>
                  {storeKeys.map((k) => (
                    <tr key={k}>
                      <td>{k}</td>
                      <td>
                        {preview.stores[k] === null
                          ? "ไม่มีข้อมูลที่บันทึก (จะลบ key ส่วนนี้)"
                          : Object.entries(preview.stores[k] as object)
                              .filter(([, v]) => Array.isArray(v))
                              .map(
                                ([name, v]) =>
                                  name + ": " + (v as unknown[]).length,
                              )
                              .join(" · ") || "ข้อมูลที่ตรวจแล้ว"}
                      </td>
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
              ฉันสำรองข้อมูลปัจจุบันและยอมรับการแทนที่ข้อมูลทั้งหมด
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
                if (!expected) return;
                setBusy(true);
                try {
                  restoreBackup(localStorage, preview, expected);
                  window.location.reload();
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
                      " กรุณาโหลดหน้าใหม่เพื่อให้ระบบตรวจ recovery ก่อนทำงานต่อ",
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
