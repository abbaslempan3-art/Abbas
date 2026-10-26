import { assertSafeTree, storeKeys, validStore, type StoreKey } from "./schema";
export type Backup = {
  format: "abbas-backup";
  version: 1;
  exportedAt: string;
  stores: Record<StoreKey, unknown | null>;
  sources?: Record<StoreKey, "localStorage" | "active-memory" | "absent">;
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
export type ActiveStores = Record<StoreKey, unknown>;
const collections: Record<StoreKey, string[]> = {
  "abbas-command-center-v1": ["projects", "tasks", "customers"],
  "abbas-business-v1": [
    "favorites",
    "customTools",
    "costs",
    "entries",
    "contents",
    "workflows",
  ],
  "abbas-command-center-v2": ["drafts", "accounts"],
  "abbas-workspace-v3": ["deals", "budgets"],
};
export function summarizeStore(
  key: StoreKey,
  value: unknown,
): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(
    collections[key].map((name) => {
      const v = (value as Record<string, unknown>)[name];
      return [
        name,
        Array.isArray(v)
          ? v.length
          : v && typeof v === "object"
            ? Object.keys(v).length
            : 0,
      ];
    }),
  );
}
export function hasBackupData(backup: Backup) {
  return storeKeys.some((k) =>
    Object.values(summarizeStore(k, backup.stores[k])).some((n) => n > 0),
  );
}
export function createBackup(storage: Storage, active?: ActiveStores): Backup {
  const raw = snapshot(storage);
  for (const k of storeKeys)
    if (raw[k] !== null) {
      try {
        if (!validStore(k, JSON.parse(raw[k]!))) throw Error();
      } catch {
        throw Error(
          "ข้อมูล localStorage ไม่ถูกต้องใน " +
            k +
            " กรุณาสำรองข้อมูลดิบ ไม่ใช้ข้อมูลตัวอย่างทับข้อมูลเดิม",
        );
      }
    }
  const sources = Object.fromEntries(
    storeKeys.map((k) => [
      k,
      raw[k] !== null
        ? "localStorage"
        : active && Object.hasOwn(active, k)
          ? "active-memory"
          : "absent",
    ]),
  ) as NonNullable<Backup["sources"]>;
  const backup: Backup = {
    format: "abbas-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    sources,
    stores: Object.fromEntries(
      storeKeys.map((k) => [
        k,
        raw[k] !== null
          ? JSON.parse(raw[k]!)
          : active && Object.hasOwn(active, k)
            ? active[k]
            : null,
      ]),
    ) as Backup["stores"],
  };
  // Present but invalid stored data must fail validation, never be silently replaced by demo state.
  const checked = parseBackup(JSON.stringify(backup));
  if (!hasBackupData(checked))
    throw Error(
      "ไม่พบข้อมูลสำหรับสำรอง จึงไม่สร้างไฟล์ว่าง กรุณาตรวจแหล่งข้อมูลก่อน",
    );
  return checked;
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
function equalData(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b))
    return a.length === b.length && a.every((x, i) => equalData(x, b[i]));
  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    const left = a as Record<string, unknown>,
      right = b as Record<string, unknown>;
    return (
      Object.keys(left).length === Object.keys(right).length &&
      Object.keys(left).every(
        (k) => Object.hasOwn(right, k) && equalData(left[k], right[k]),
      )
    );
  }
  return false;
}
function mergeData(current: unknown, incoming: unknown, path: string): unknown {
  if (equalData(current, incoming)) return current;
  if (Array.isArray(current) && Array.isArray(incoming)) {
    if ([...current, ...incoming].every((v) => typeof v === "string"))
      return [...new Set([...current, ...incoming])];
    if (
      [...current, ...incoming].every(
        (v) => v && typeof v === "object" && typeof v.id === "string",
      )
    ) {
      const records = [...current];
      const byId = new Map(current.map((v) => [v.id, v]));
      for (const item of incoming) {
        const prior = byId.get(item.id);
        if (prior && !equalData(prior, item))
          throw Error(
            "พบ ID เดิมแต่ข้อมูลต่างกันใน " +
              path +
              " — หยุดกู้คืนเพื่อไม่เขียนทับ กรุณาตรวจไฟล์ก่อน",
          );
        if (!prior) {
          records.push(item);
          byId.set(item.id, item);
        }
      }
      return records;
    }
  }
  if (
    current &&
    incoming &&
    typeof current === "object" &&
    typeof incoming === "object" &&
    !Array.isArray(current) &&
    !Array.isArray(incoming)
  ) {
    const result = { ...current } as Record<string, unknown>;
    for (const [k, v] of Object.entries(incoming))
      result[k] = Object.hasOwn(result, k)
        ? mergeData(result[k], v, path + "." + k)
        : v;
    return result;
  }
  throw Error(
    "ข้อมูลขัดแย้งใน " + path + " — หยุดกู้คืนเพื่อไม่เขียนทับข้อมูลเดิม",
  );
}
/** Add-only restore: null keeps existing data; different values for an existing record/key are conflicts. */
export function planRestore(
  backup: Backup,
  current: RawStores,
): Backup["stores"] {
  parseBackup(JSON.stringify(backup));
  if (!hasBackupData(backup))
    throw Error(
      "ไฟล์ไม่มีข้อมูลสำหรับกู้คืน ห้ามใช้ไฟล์ว่างหรือ null ทั้งหมดแทนที่ข้อมูลเดิม",
    );
  const result = {} as Backup["stores"];
  for (const k of storeKeys) {
    const old = current[k] === null ? null : JSON.parse(current[k]!);
    if (current[k] !== null) {
      assertSafeTree(old);
      if (!validStore(k, old))
        throw Error(
          "ข้อมูลเดิมอ่านไม่ได้ใน " +
            k +
            " กรุณาสำรองข้อมูลดิบก่อน ไม่เขียนทับอัตโนมัติ",
        );
    }
    const incoming = backup.stores[k];
    const populated = Object.values(summarizeStore(k, incoming)).some(
      (n) => n > 0,
    );
    result[k] = !populated
      ? old
      : old === null
        ? incoming
        : mergeData(old, incoming, k);
  }
  return result;
}
export function restoreBackup(
  storage: Storage,
  backup: Backup,
  expected: RawStores,
) {
  parseBackup(JSON.stringify(backup));
  if (!hasBackupData(backup))
    throw Error(
      "ไฟล์ไม่มีข้อมูลสำหรับกู้คืน ห้ามใช้ไฟล์ว่างหรือ null ทั้งหมดแทนที่ข้อมูลเดิม",
    );
  if (JSON.stringify(snapshot(storage)) !== JSON.stringify(expected))
    throw Error("ข้อมูลเปลี่ยนหลังเลือกไฟล์ กรุณาตรวจไฟล์และยืนยันใหม่");
  const merged = planRestore(backup, expected);
  if (
    !storeKeys.some((k) =>
      expected[k] === null
        ? merged[k] !== null
        : !equalData(JSON.parse(expected[k]!), merged[k]),
    )
  )
    return false;
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
      const value = merged[k];
      // Missing sections preserve their existing storage; null must never erase user records.
      if (value !== null) storage.setItem(k, JSON.stringify(value));
    }
    storage.setItem(journalKey, JSON.stringify({ ...j, stage: "committed" }));
    return true;
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
