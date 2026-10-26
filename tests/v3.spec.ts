import { test, expect, type Page } from "@playwright/test";
import {
  createBackup,
  parseBackup,
  restoreBackup,
  snapshot,
  journalKey,
  recoverInterruptedRestore,
  previousSnapshot,
  maxBackupBytes,
} from "../src/v3/backup";
import { storeKeys } from "../src/v3/schema";
class MemoryStorage implements Storage {
  values = new Map<string, string>();
  failKey = "";
  failAll = false;
  get length() {
    return this.values.size;
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
  clear() {
    this.values.clear();
  }
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  removeItem(k: string) {
    if (this.failAll) throw Error("quota");
    this.values.delete(k);
  }
  setItem(k: string, v: string) {
    if (this.failAll) throw Error("quota");
    if (this.failKey === k) {
      this.failKey = "";
      throw Error("quota once");
    }
    this.values.set(k, v);
  }
}
const legacy = {
  projects: [
    {
      id: "p",
      name: "โครงการที่ต้องรักษา",
      description: "สมมติ",
      status: "วางแผน",
      metadata: "keep",
    },
  ],
  tasks: [
    {
      id: "t",
      name: "งานติดตามเดิม",
      project: "p",
      due: "2026-10-25",
      priority: "สูง",
      status: "กำลังทำ",
    },
  ],
  customers: [
    {
      id: "c",
      name: "ลูกค้าสมมติเดิม",
      company: "ธุรกิจตัวอย่าง",
      status: "ลูกค้าใหม่",
    },
  ],
};
const business = {
  version: 1,
  favorites: ["tool-chatgpt"],
  customTools: [],
  costs: { "tool-chatgpt": 100 },
  entries: [
    {
      id: "e",
      name: "รายจ่ายสมมติ",
      kind: "expense",
      amount: 1200,
      date: "2026-10-20",
      business: "AI Marketing Studio",
    },
  ],
  contents: [],
  workflows: [],
};
const v2 = {
  version: 2,
  drafts: [
    {
      id: "d",
      title: "ร่างเดิม",
      prompt: "ข้อมูลสมมติ",
      toolId: "tool-chatgpt",
      department: "การตลาด",
      createdAt: "2026-10-26T00:00:00Z",
    },
  ],
  accounts: {},
};
function fixture() {
  const storage = new MemoryStorage();
  [legacy, business, v2, { version: 3, deals: [], budgets: {} }].forEach(
    (v, i) => storage.setItem(storeKeys[i], JSON.stringify(v)),
  );
  storage.setItem("unrelated", "preserve");
  return storage;
}
const nav = async (page: Page, name: string) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
async function seed(page: Page) {
  await page.addInitScript(
    ({ keys, data }) => {
      keys.forEach((k, i) => {
        if (localStorage.getItem(k) === null)
          localStorage.setItem(k, JSON.stringify(data[i]));
      });
    },
    {
      keys: [...storeKeys],
      data: [legacy, business, v2, { version: 3, deals: [], budgets: {} }],
    },
  );
}
test("backup round trip retains four namespaces and unknown metadata without touching unrelated data", () => {
  const storage = fixture();
  const backup = createBackup(storage);
  const original = snapshot(storage);
  storage.setItem(storeKeys[0], JSON.stringify({ ...legacy, tasks: [] }));
  const before = snapshot(storage);
  restoreBackup(storage, backup, before);
  expect(snapshot(storage)).toEqual(original);
  expect(previousSnapshot(storage)).toEqual(before);
  expect(storage.getItem("unrelated")).toBe("preserve");
  expect(recoverInterruptedRestore(storage)).toBe(false);
});
test("backup validation rejects unsafe, incomplete, duplicate and oversized records before writing", () => {
  const storage = fixture();
  const before = snapshot(storage);
  const backup = createBackup(storage);
  for (const change of [
    (b: any) => (b.version = 999),
    (b: any) => delete b.stores[storeKeys[2]],
    (b: any) =>
      b.stores[storeKeys[0]].tasks.push(b.stores[storeKeys[0]].tasks[0]),
    (b: any) => (b.stores[storeKeys[1]].entries[0].amount = -1),
    (b: any) =>
      (b.stores[storeKeys[1]].customTools = [
        {
          id: "bad",
          name: "bad",
          url: "javascript:alert(1)",
          category: "demo",
          description: "demo",
          jobs: [],
        },
      ]),
  ]) {
    const b = structuredClone(backup);
    change(b);
    expect(() => parseBackup(JSON.stringify(b))).toThrow();
    expect(snapshot(storage)).toEqual(before);
  }
  expect(() => parseBackup('{"__proto__":{"polluted":true}}')).toThrow();
  expect(() =>
    parseBackup(JSON.stringify({ ...backup, secret: "not-allowed" })),
  ).toThrow();
  expect(() => parseBackup(" ".repeat(maxBackupBytes + 1))).toThrow();
  expect(() => parseBackup("{broken")).toThrow();
});
test("restore fails safely before journal, rolls back partial writes, and recovers an interrupted restore", () => {
  const storage = fixture();
  const backup = createBackup(storage);
  (backup.stores[storeKeys[0]] as typeof legacy).projects.push({
    ...legacy.projects[0],
    id: "p-new",
    name: "หลัง restore",
  });
  const before = snapshot(storage);
  storage.failKey = journalKey;
  expect(() => restoreBackup(storage, backup, before)).toThrow();
  expect(snapshot(storage)).toEqual(before);
  storage.failKey = storeKeys[1];
  expect(() => restoreBackup(storage, backup, before)).toThrow("ย้อนกลับ");
  expect(snapshot(storage)).toEqual(before);
  storage.setItem(
    journalKey,
    JSON.stringify({
      version: 1,
      stage: "prepared",
      createdAt: new Date().toISOString(),
      before,
    }),
  );
  storage.setItem(storeKeys[0], JSON.stringify(backup.stores[storeKeys[0]]));
  storage.failAll = true;
  expect(() => recoverInterruptedRestore(storage)).toThrow();
  expect(JSON.parse(storage.getItem(journalKey)!).stage).toBe("prepared");
  storage.failAll = false;
  expect(recoverInterruptedRestore(storage)).toBe(true);
  expect(snapshot(storage)).toEqual(before);
  const stale = snapshot(storage);
  storage.setItem(storeKeys[2], JSON.stringify({ ...v2, drafts: [] }));
  expect(() => restoreBackup(storage, backup, stale)).toThrow("เปลี่ยน");
});
test("V3 financial budgets, CRM followups and AI briefs preserve existing records", async ({
  page,
}) => {
  await seed(page);
  await page.clock.setFixedTime(new Date("2026-10-26T05:00:00Z"));
  await page.goto("/");
  await nav(page, "พื้นที่ทำงาน V3");
  await expect(page.getByText("งานติดตามเดิม", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "แผนการเงิน", exact: true }).click();
  await page.getByLabel("งบรายจ่าย V3 (บาท)", { exact: true }).fill("1000");
  await page
    .getByRole("button", { name: "บันทึกงบรายเดือน", exact: true })
    .click();
  await expect(page.getByText(/รายจ่ายตัวอย่างเกินงบ/)).toContainText("200");
  await page.getByRole("tab", { name: "ติดตามลูกค้า", exact: true }).click();
  await page.getByLabel("มูลค่าโอกาสขาย (บาท)", { exact: true }).fill("5000");
  await page.getByLabel("วันติดตามลูกค้า", { exact: true }).fill("2026-10-26");
  await page
    .getByRole("button", { name: "บันทึกการติดตามลูกค้า", exact: true })
    .click();
  await expect(page.locator(".v3-followups")).toContainText("ลูกค้าสมมติเดิม");
  await page.getByRole("tab", { name: "AI Brief", exact: true }).click();
  await page.getByLabel("ชื่อ AI Brief", { exact: true }).fill("แผน V3");
  await page
    .getByLabel("เป้าหมายสมมติ", { exact: true })
    .fill("ลดของเสียร้านอาหารสมมติ");
  await page
    .getByRole("button", { name: "สร้างร่าง AI Brief", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ยังไม่ได้ส่ง AI");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("abbas-command-center-v1")!),
    ),
  ).toEqual(legacy);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("abbas-business-v1")!),
    ),
  ).toEqual(business);
  const drafts = await page.evaluate(
    () => JSON.parse(localStorage.getItem("abbas-command-center-v2")!).drafts,
  );
  expect(drafts).toHaveLength(2);
  expect(drafts[1]).toEqual(v2.drafts[0]);
  await page.reload();
  await nav(page, "พื้นที่ทำงาน V3");
  await page.getByRole("tab", { name: "แผนการเงิน", exact: true }).click();
  await expect(
    page.getByLabel("งบรายจ่าย V3 (บาท)", { exact: true }),
  ).toHaveValue("1000");
});
test("backup UI requires confirmation, rejects invalid input, restores data and downloads previous copy", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  await nav(page, "สำรองและกู้คืน");
  const before = await page.evaluate(() =>
    Object.fromEntries(
      [
        "abbas-command-center-v1",
        "abbas-business-v1",
        "abbas-command-center-v2",
        "abbas-workspace-v3",
      ].map((k) => [k, localStorage.getItem(k)]),
    ),
  );
  await page
    .getByRole("button", { name: "ตรวจสอบ Backup ก่อนดาวน์โหลด", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "ยืนยันดาวน์โหลด Backup JSON", exact: true })
    .click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let raw = "";
  for await (const chunk of stream!) raw += chunk;
  const backup = parseBackup(raw);
  (backup.stores[storeKeys[0]] as typeof legacy).projects.push({
    ...legacy.projects[0],
    id: "p-imported",
    name: "โครงการจากไฟล์สำรอง",
  });
  await page.getByLabel("ไฟล์สำรอง JSON", { exact: true }).setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from("{}"),
  });
  await expect(page.getByRole("status")).toContainText("รูปแบบไฟล์");
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        [
          "abbas-command-center-v1",
          "abbas-business-v1",
          "abbas-command-center-v2",
          "abbas-workspace-v3",
        ].map((k) => [k, localStorage.getItem(k)]),
      ),
    ),
  ).toEqual(before);
  await page.getByLabel("ไฟล์สำรอง JSON", { exact: true }).setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(
    page.getByRole("button", { name: "ยืนยันกู้คืนข้อมูล", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByLabel("คำยืนยันกู้คืน", { exact: true }).fill("กู้คืน");
  await page
    .getByRole("button", { name: "ยืนยันกู้คืนข้อมูล", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "ภาพรวมธุรกิจของคุณ." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("abbas-command-center-v1")!).projects[1]
          .name,
    ),
  ).toBe("โครงการจากไฟล์สำรอง");
  await nav(page, "สำรองและกู้คืน");
  const previous = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "ดาวน์โหลดสำเนาก่อนกู้คืน", exact: true })
    .click();
  expect((await previous).suggestedFilename()).toBe(
    "abbas-before-restore.json",
  );
});
test("startup rolls back a pending journal before mounting V1/V2 stores", async ({
  page,
}) => {
  const storage = fixture();
  const before = snapshot(storage);
  await page.addInitScript(
    ({ keys, before, journal }) => {
      keys.forEach((k) => {
        if (before[k] !== null) localStorage.setItem(k, before[k]);
      });
      localStorage.setItem(
        keys[0],
        JSON.stringify({ projects: [], tasks: [], customers: [] }),
      );
      localStorage.setItem(
        journal,
        JSON.stringify({
          version: 1,
          stage: "prepared",
          createdAt: new Date().toISOString(),
          before,
        }),
      );
    },
    { keys: [...storeKeys], before, journal: journalKey },
  );
  await page.goto("/");
  await expect(page.getByRole("status")).toContainText(
    "ย้อนกลับการกู้คืนที่ค้างสำเร็จ",
  );
  await nav(page, "โครงการ");
  await expect(
    page.getByRole("heading", { name: "โครงการที่ต้องรักษา", exact: true }),
  ).toBeVisible();
});
test("V3 mobile workspace and restore preview fit 390 and 320 pixels", async ({
  page,
}) => {
  await seed(page);
  await page.goto("/");
  const backup = createBackup(fixture());
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
    await nav(page, "พื้นที่ทำงาน V3");
    for (const name of [
      "ติดตามงาน",
      "แผนการเงิน",
      "ติดตามลูกค้า",
      "AI Brief",
    ]) {
      await page.getByRole("tab", { name, exact: true }).click();
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
    await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
    await nav(page, "สำรองและกู้คืน");
    await page.getByLabel("ไฟล์สำรอง JSON", { exact: true }).setInputFiles({
      name: "test.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup)),
    });
    await expect(page.getByRole("status")).toContainText("ตรวจไฟล์ผ่านแล้ว");
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
});
test("failed startup recovery blocks editing and allows a raw emergency download", async ({
  page,
}) => {
  const before = snapshot(fixture());
  await page.addInitScript(
    ({ before, keys, journal }) => {
      for (const k of keys)
        if (before[k] !== null) localStorage.setItem(k, before[k]);
      localStorage.setItem(
        journal,
        JSON.stringify({
          version: 1,
          stage: "prepared",
          createdAt: new Date().toISOString(),
          before,
        }),
      );
      Storage.prototype.setItem = () => {
        throw Error("persistent quota");
      };
    },
    { before, keys: [...storeKeys], journal: journalKey },
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText("ระบบหยุดการแก้ไข");
  await expect(page.getByRole("navigation")).toHaveCount(0);
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "สำรองข้อมูลดิบฉุกเฉิน", exact: true })
    .click();
  expect((await pending).suggestedFilename()).toBe(
    "abbas-emergency-recovery.json",
  );
});
