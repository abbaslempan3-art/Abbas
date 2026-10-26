import { test, expect, type Page } from "@playwright/test";
import {
  createBackup,
  parseBackup,
  restoreBackup,
  snapshot,
  journalKey,
  type ActiveStores,
} from "../src/v3/backup";
import { storeKeys } from "../src/v3/schema";
class MemoryStorage implements Storage {
  values = new Map<string, string>();
  writes = 0;
  get length() {
    return this.values.size;
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
  clear() {
    throw Error("clear is forbidden");
  }
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.writes++;
    this.values.set(k, v);
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
}
function models(): ActiveStores {
  return {
    [storeKeys[0]]: {
      projects: [
        {
          id: "p",
          name: "โครงการสมมติ",
          description: "demo",
          status: "วางแผน",
        },
      ],
      tasks: [
        {
          id: "t",
          name: "งานที่ผู้ใช้บันทึก",
          project: "p",
          due: "",
          priority: "สูง",
          status: "กำลังทำ",
          metadata: { keep: "original" },
        },
      ],
      customers: [],
    },
    [storeKeys[1]]: {
      version: 1,
      favorites: ["tool-claude"],
      customTools: [],
      costs: { "tool-claude": 120 },
      entries: [
        {
          id: "expense",
          name: "รายจ่ายสมมติ",
          kind: "expense",
          amount: 100,
          date: "2026-10-27",
          business: "AI Marketing Studio",
        },
      ],
      contents: [],
      workflows: [],
    },
    [storeKeys[2]]: {
      version: 2,
      drafts: [
        {
          id: "draft",
          title: "ร่างที่บันทึก",
          prompt: "เป้าหมายสมมติ",
          toolId: "tool-claude",
          department: "การตลาด",
          createdAt: "2026-10-27T00:00:00Z",
        },
      ],
      accounts: { "tool-claude": { trialEnd: "", usage: { "2026-10": 20 } } },
    },
    [storeKeys[3]]: {
      version: 3,
      deals: [
        {
          id: "customer-note",
          value: 5000,
          followUp: "2026-10-28",
          note: "สมมติ",
        },
      ],
      budgets: { "2026-10": 2000 },
    },
  };
}
function fixture() {
  const s = new MemoryStorage();
  const m = models();
  for (const k of storeKeys) s.setItem(k, JSON.stringify(m[k]));
  s.setItem("unrelated", "keep");
  return s;
}
const nav = async (page: Page) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name: "สำรองและกู้คืน", exact: true })
    .click();
async function downloadBackup(page: Page) {
  await page
    .getByRole("button", { name: "ตรวจสอบ Backup ก่อนดาวน์โหลด", exact: true })
    .click();
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "ยืนยันดาวน์โหลด Backup JSON", exact: true })
    .click();
  const file = await pending;
  const stream = await file.createReadStream();
  let raw = "";
  for await (const chunk of stream!) raw += chunk;
  return parseBackup(raw);
}
test("fresh browser exports the five displayed tasks without writing local or session storage", async ({
  page,
}) => {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "abbas-command-center-v1",
      JSON.stringify({
        tasks: [{ id: "session-only", name: "ไม่ใช่ข้อมูลที่แอปใช้" }],
      }),
    ),
  );
  await page.goto("/");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /^งานทั้งหมด/ })
    .click();
  await expect(page.locator("tbody tr")).toHaveCount(5);
  await nav(page);
  const backup = await downloadBackup(page);
  expect((backup.stores[storeKeys[0]] as any).tasks).toHaveLength(5);
  expect(storeKeys.every((k) => backup.stores[k] !== null)).toBe(true);
  expect(Object.values(backup.sources!)).toEqual(
    Array(4).fill("active-memory"),
  );
  expect(
    await page.evaluate(
      (keys) => keys.map((k) => localStorage.getItem(k)),
      [...storeKeys],
    ),
  ).toEqual([null, null, null, null]);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(sessionStorage.getItem("abbas-command-center-v1")!).tasks[0]
          .id,
    ),
  ).toBe("session-only");
});
test("persisted data takes precedence over memory and all namespaces round-trip exactly", () => {
  const storage = fixture();
  const active = models();
  (active[storeKeys[0]] as any).tasks[0].name = "outdated memory";
  const before = snapshot(storage);
  const backup = createBackup(storage, active);
  expect(backup.stores).toEqual(models());
  expect(Object.values(backup.sources!)).toEqual(Array(4).fill("localStorage"));
  expect(snapshot(storage)).toEqual(before);
  const fresh = new MemoryStorage();
  expect(restoreBackup(fresh, backup, snapshot(fresh))).toBe(true);
  expect(createBackup(fresh).stores).toEqual(backup.stores);
});
test("empty exports and all-null imports are blocked; null and empty sections preserve existing records", () => {
  const empty = new MemoryStorage();
  expect(() => createBackup(empty)).toThrow("ไม่พบข้อมูล");
  const storage = fixture();
  const before = snapshot(storage);
  const backup = createBackup(storage);
  const allNull = {
    ...backup,
    stores: Object.fromEntries(storeKeys.map((k) => [k, null])),
  };
  expect(() =>
    restoreBackup(storage, parseBackup(JSON.stringify(allNull)), before),
  ).toThrow("ไม่มีข้อมูล");
  expect(snapshot(storage)).toEqual(before);
  expect(storage.getItem(journalKey)).toBeNull();
  const partial = createBackup(storage);
  partial.stores[storeKeys[0]] = null;
  partial.stores[storeKeys[2]] = { version: 2, drafts: [], accounts: {} };
  (partial.stores[storeKeys[3]] as any).budgets["2026-11"] = 3000;
  expect(restoreBackup(storage, partial, before)).toBe(true);
  expect(storage.getItem(storeKeys[0])).toBe(before[storeKeys[0]]);
  expect(storage.getItem(storeKeys[2])).toBe(before[storeKeys[2]]);
  expect(storage.getItem("unrelated")).toBe("keep");
});
test("conflicting IDs or money values stop the entire restore before any writes", () => {
  const storage = fixture();
  const backup = createBackup(storage);
  (backup.stores[storeKeys[0]] as any).tasks[0].name = "conflicting edit";
  (backup.stores[storeKeys[1]] as any).entries.push({
    id: "new",
    name: "must not be written",
    kind: "income",
    amount: 50,
    date: "2026-10-27",
    business: "demo",
  });
  const before = snapshot(storage);
  const writes = storage.writes;
  expect(() => restoreBackup(storage, backup, before)).toThrow("ID เดิม");
  expect(snapshot(storage)).toEqual(before);
  expect(storage.writes).toBe(writes);
  expect(storage.getItem(journalKey)).toBeNull();
  const money = createBackup(storage);
  (money.stores[storeKeys[3]] as any).budgets["2026-10"] = 1;
  expect(() => restoreBackup(storage, money, before)).toThrow("ขัดแย้ง");
  expect(storage.writes).toBe(writes);
});
test("same backup is idempotent and add-only restore preserves every existing ID and metadata", () => {
  const storage = fixture();
  const original = createBackup(storage);
  const writes = storage.writes;
  expect(restoreBackup(storage, original, snapshot(storage))).toBe(false);
  expect(storage.writes).toBe(writes);
  const backup = createBackup(storage);
  (backup.stores[storeKeys[0]] as any).tasks = [
    {
      id: "new-task",
      name: "งานใหม่สมมติ",
      project: "p",
      due: "",
      priority: "ต่ำ",
      status: "รอดำเนินการ",
    },
  ];
  restoreBackup(storage, backup, snapshot(storage));
  const result = JSON.parse(storage.getItem(storeKeys[0])!);
  expect(result.tasks.map((t: any) => t.id)).toEqual(["t", "new-task"]);
  expect(result.tasks[0]).toEqual((models()[storeKeys[0]] as any).tasks[0]);
  const committed = storage.getItem(journalKey);
  expect(restoreBackup(storage, backup, snapshot(storage))).toBe(false);
  expect(storage.getItem(journalKey)).toBe(committed);
});
test("invalid persisted data never falls back to demo; valid saved empty task list is respected", () => {
  const storage = fixture();
  storage.setItem(storeKeys[0], "{broken");
  const before = snapshot(storage);
  expect(() => createBackup(storage, models())).toThrow("localStorage");
  expect(snapshot(storage)).toEqual(before);
  storage.setItem(storeKeys[0], "null");
  expect(() => createBackup(storage, models())).toThrow("localStorage");
  storage.setItem(
    storeKeys[0],
    JSON.stringify({ projects: [], tasks: [], customers: [] }),
  );
  expect(
    (createBackup(storage, models()).stores[storeKeys[0]] as any).tasks,
  ).toEqual([]);
});
test("export confirmation detects stale data and never downloads the outdated snapshot", async ({
  page,
}) => {
  await page.goto("/");
  await nav(page);
  await page
    .getByRole("button", { name: "ตรวจสอบ Backup ก่อนดาวน์โหลด", exact: true })
    .click();
  const files: string[] = [];
  page.on("download", (d) => files.push(d.suggestedFilename()));
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: storeKeys[0], value: models()[storeKeys[0]] },
  );
  await page
    .getByRole("button", { name: "ยืนยันดาวน์โหลด Backup JSON", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ข้อมูลเปลี่ยนหลังตรวจ");
  expect(files).toEqual([]);
  const backup = await downloadBackup(page);
  expect((backup.stores[storeKeys[0]] as any).tasks[0].name).toBe(
    "งานที่ผู้ใช้บันทึก",
  );
});
test("UI rejects an all-null backup without exposing restore confirmation or modifying data", async ({
  page,
}) => {
  await page.addInitScript((m) => {
    for (const [key, value] of Object.entries(m))
      localStorage.setItem(key, JSON.stringify(value));
  }, models());
  await page.goto("/");
  await nav(page);
  const before = await page.evaluate(
    (keys) => keys.map((k) => localStorage.getItem(k)),
    [...storeKeys],
  );
  const file = {
    format: "abbas-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    stores: Object.fromEntries(storeKeys.map((k) => [k, null])),
  };
  await page
    .getByLabel("ไฟล์สำรอง JSON", { exact: true })
    .setInputFiles({
      name: "empty.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(file)),
    });
  await expect(page.getByRole("status")).toContainText(
    "ไม่มีข้อมูลสำหรับกู้คืน",
  );
  await expect(
    page.getByRole("button", { name: "ยืนยันกู้คืนข้อมูล", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      (keys) => keys.map((k) => localStorage.getItem(k)),
      [...storeKeys],
    ),
  ).toEqual(before);
});
