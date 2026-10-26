import { assertSafeTree, storeKeys, validStore, type StoreKey } from "./schema";
export type Backup = {
  format: "abbas-backup";
  version: 1;
  exportedAt: string;
  stores: Record<StoreKey, unknown | null>;
};
type RawStores = Record<StoreKey, string | null>;
type Journal = {
  version: 1;
  stage: "prepared" | "committed";
  createdAt: string;
  before: RawStores;
};
export const journalKey = "abbas-restore-journal-v3";
export const maxBackupBytes = 5 * 1024 * 1024;
export function snapshot(storage: Storage): RawStores {
  return Object.fromEntries(
    storeKeys.map((k) => [k, storage.getItem(k)]),
  ) as RawStores;
}
export function createBackup(storage: Storage): Backup {
  const raw = snapshot(storage);
  const backup: Backup = {
    format: "abbas-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    stores: Object.fromEntries(
      storeKeys.map((k) => [k, raw[k] === null ? null : JSON.parse(raw[k]!)]),
    ) as Backup["stores"],
  };
  return parseBackup(JSON.stringify(backup));
}
export function parseBackup(text: string): Backup {
  if (new Blob([text]).size > maxBackupBytes)
    throw Error("ไฟล์ต้องไม่เกิน 5 MB");
  const value = JSON.parse(text);
  assertSafeTree(value);
  if (
    !value ||
    value.format !== "abbas-backup" ||
    value.version !== 1 ||
    typeof value.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(value.exportedAt)) ||
    !value.stores ||
    typeof value.stores !== "object" ||
    Array.isArray(value.stores)
  )
    throw Error("รูปแบบไฟล์สำรองไม่ถูกต้อง หรือเป็นเวอร์ชันที่ยังไม่รองรับ");
  if (
    Object.keys(value.stores).length !== storeKeys.length ||
    !storeKeys.every((k) => Object.hasOwn(value.stores, k))
  )
    throw Error("ไฟล์ต้องมีข้อมูลครบทั้ง V1, Business, V2 และ V3");
  for (const k of storeKeys)
    if (value.stores[k] !== null && !validStore(k, value.stores[k]))
      throw Error("ข้อมูลไม่ผ่านการตรวจรูปแบบหรือมี ID ซ้ำ: " + k);
  return value;
}
function journal(storage: Storage): Journal | null {
  const raw = storage.getItem(journalKey);
  if (!raw) return null;
  const j = JSON.parse(raw);
  if (
    j?.version !== 1 ||
    !["prepared", "committed"].includes(j.stage) ||
    !j.before ||
    !storeKeys.every(
      (k) => j.before[k] === null || typeof j.before[k] === "string",
    )
  )
    throw Error(
      "ข้อมูล recovery journal ไม่ถูกต้อง กรุณาสำรองข้อมูลดิบก่อนตรวจแก้",
    );
  return j;
}
export function hasPendingRestore(storage: Storage) {
  return journal(storage)?.stage === "prepared";
}
function writeRaw(storage: Storage, raw: RawStores) {
  for (const k of storeKeys) {
    if (raw[k] === null) storage.removeItem(k);
    else storage.setItem(k, raw[k]!);
  }
}
/** Called before mounting stores. Pending restore is rolled back, never silently loaded as mixed data. */
export function recoverInterruptedRestore(storage: Storage) {
  const j = journal(storage);
  if (!j || j.stage === "committed") return false;
  writeRaw(storage, j.before);
  storage.setItem(journalKey, JSON.stringify({ ...j, stage: "committed" }));
  return true;
}
export function previousSnapshot(storage: Storage): RawStores | null {
  return journal(storage)?.before || null;
}
export function restoreBackup(
  storage: Storage,
  backup: Backup,
  expected: RawStores,
) {
  parseBackup(JSON.stringify(backup));
  if (JSON.stringify(snapshot(storage)) !== JSON.stringify(expected))
    throw Error("ข้อมูลเปลี่ยนหลังเลือกไฟล์ กรุณาตรวจไฟล์และยืนยันใหม่");
  const existing = journal(storage);
  if (existing?.stage === "prepared")
    throw Error("มีการกู้คืนค้างอยู่ ต้องกู้ข้อมูลเดิมให้เสร็จก่อน");
  const j: Journal = {
    version: 1,
    stage: "prepared",
    createdAt: new Date().toISOString(),
    before: expected,
  };
  // Fail before touching stores if there is insufficient room for the durable pre-restore copy.
  storage.setItem(journalKey, JSON.stringify(j));
  try {
    for (const k of storeKeys) {
      const value = backup.stores[k];
      if (value === null) storage.removeItem(k);
      else storage.setItem(k, JSON.stringify(value));
    }
    storage.setItem(journalKey, JSON.stringify({ ...j, stage: "committed" }));
  } catch {
    try {
      writeRaw(storage, expected);
      storage.setItem(journalKey, JSON.stringify({ ...j, stage: "committed" }));
    } catch {
      throw Error(
        "กู้คืนไม่สำเร็จและ rollback ยังไม่ครบ ข้อมูลก่อนกู้คืนอยู่ใน recovery journal ห้ามแก้ข้อมูลต่อจนกู้คืนเสร็จ",
      );
    }
    throw Error(
      "กู้คืนไม่สำเร็จ ย้อนกลับข้อมูลเดิมแล้ว กรุณาตรวจพื้นที่ Local Storage",
    );
  }
}
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
