import { test, expect } from "@playwright/test";
import {
  createBackup,
  parseBackup,
  restoreBackup,
  snapshot,
  journalKey,
  recoverInterruptedRestore,
  previousSnapshot,
} from "../src/v3/backup";
import { storeKeys } from "../src/v3/schema";

// This suite uses only an in-process Map. No browser, localStorage, server or network fixture.
class AuditStorage implements Storage {
  values = new Map<string, string>();
  writes = 0;
  failOnce = "";
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (key === this.failOnce) {
      this.failOnce = "";
      throw Error("simulated quota");
    }
    this.writes++;
    this.values.set(key, value);
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  clear() {
    throw Error("clearing storage is forbidden");
  }
}
function data(prefix: string, month = "2026-10") {
  const tool = prefix + "-tool",
    project = prefix + "-project",
    customer = prefix + "-customer";
  return {
    [storeKeys[0]]: {
      projects: [
        {
          id: project,
          name: "โครงการจำลอง " + prefix,
          description: "ใช้ทดสอบเท่านั้น",
          status: "กำลังดำเนินการ",
          business: "AI Marketing Studio",
          metadata: { preserve: true },
        },
      ],
      tasks: [
        {
          id: prefix + "-task",
          name: "งานจำลอง " + prefix,
          project,
          due: month + "-28",
          priority: "สูง",
          status: "กำลังทำ",
          department: "การตลาด",
          metadata: { original: prefix },
        },
      ],
      customers: [
        {
          id: customer,
          name: "ลูกค้าสมมติ " + prefix,
          company: "ธุรกิจสมมติ",
          status: "กำลังเจรจา",
        },
      ],
    },
    [storeKeys[1]]: {
      version: 1,
      favorites: [tool, "tool-chatgpt"],
      customTools: [
        {
          id: tool,
          name: "เครื่องมือสมมติ " + prefix,
          url: "https://example.com",
          category: "Business & Analytics",
          description: "ไม่เรียกเว็บไซต์จริง",
          jobs: ["วิเคราะห์ธุรกิจ"],
          custom: true,
        },
      ],
      costs: { [tool]: 125.25 },
      entries: [
        {
          id: prefix + "-income",
          name: "รายรับจำลอง",
          kind: "income",
          amount: 12345.5,
          date: month + "-20",
          business: "AI Marketing Studio",
        },
        {
          id: prefix + "-expense",
          name: "รายจ่ายจำลอง",
          kind: "expense",
          amount: 4321.25,
          date: month + "-21",
          business: "AI Marketing Studio",
        },
      ],
      contents: [
        {
          id: prefix + "-content",
          title: "คอนเทนต์จำลอง",
          business: "AI Marketing Studio",
          channel: "YouTube",
          date: month + "-28",
          status: "กำลังผลิต",
          tool,
        },
      ],
      workflows: [
        {
          id: prefix + "-workflow",
          name: "Workflow จำลอง",
          business: "AI Marketing Studio",
          steps: [
            { toolId: tool, instruction: "แผนข้อความสมมติ ไม่ดำเนินการจริง" },
          ],
        },
      ],
    },
    [storeKeys[2]]: {
      version: 2,
      drafts: [
        {
          id: prefix + "-draft",
          title: "ร่างคำสั่งจำลอง",
          prompt: "ข้อมูลสมมติเท่านั้น",
          toolId: tool,
          department: "การตลาด",
          createdAt: "2026-10-27T00:00:00Z",
        },
      ],
      accounts: { [tool]: { trialEnd: "2026-10-31", usage: { [month]: 37 } } },
    },
    [storeKeys[3]]: {
      version: 3,
      deals: [
        {
          id: customer,
          value: 8750.75,
          followUp: month + "-29",
          note: "บันทึกติดตามสมมติ",
        },
      ],
      budgets: { [month]: 15000.25 },
    },
  };
}
function seeded(prefix: string, month?: string) {
  const store = new AuditStorage();
  const model = data(prefix, month);
  for (const key of storeKeys) store.setItem(key, JSON.stringify(model[key]));
  store.setItem("unrelated-key", "must-survive");
  return store;
}
function read(store: AuditStorage) {
  return Object.fromEntries(
    storeKeys.map((key) => [key, JSON.parse(store.getItem(key)!)]),
  ) as ReturnType<typeof data>;
}
function assertUnique(store: AuditStorage) {
  for (const value of Object.values(read(store)))
    for (const field of Object.values(value)) {
      if (Array.isArray(field)) {
        const ids = field.map((item) =>
          typeof item === "object" ? item.id : item,
        );
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
}

test("four-store audit: every field survives serialized JSON round-trip into an empty mock", () => {
  const source = seeded("source");
  const before = snapshot(source);
  const sourceWrites = source.writes;
  const backup = parseBackup(JSON.stringify(createBackup(source)));
  const target = new AuditStorage();
  target.setItem("unrelated-key", "must-survive");
  expect(restoreBackup(target, backup, snapshot(target))).toBe(true);
  expect(read(target)).toEqual(data("source"));
  expect(snapshot(source)).toEqual(before);
  expect(source.writes).toBe(sourceWrites);
  expect(target.getItem("unrelated-key")).toBe("must-survive");
  assertUnique(target);
  const actual = read(target);
  const core = actual[storeKeys[0]],
    business = actual[storeKeys[1]],
    v2 = actual[storeKeys[2]],
    v3 = actual[storeKeys[3]];
  expect(core.tasks[0].project).toBe(core.projects[0].id);
  expect(business.contents[0].tool).toBe(business.customTools[0].id);
  expect(business.workflows[0].steps[0].toolId).toBe(
    business.customTools[0].id,
  );
  expect(v2.drafts[0].toolId).toBe(business.customTools[0].id);
  expect(v3.deals[0].id).toBe(core.customers[0].id);
  expect(business.entries.map((e) => e.amount)).toEqual([12345.5, 4321.25]);
});

test("four-store audit: merge preserves all original records and adds complete incoming datasets", () => {
  const target = seeded("old", "2026-11");
  const before = read(target);
  const incoming = createBackup(seeded("new", "2026-10"));
  expect(restoreBackup(target, incoming, snapshot(target))).toBe(true);
  const after = read(target);
  for (const key of storeKeys) {
    for (const [field, oldValue] of Object.entries(before[key])) {
      const current = (after[key] as Record<string, unknown>)[field];
      if (Array.isArray(oldValue)) {
        for (const record of oldValue) expect(current).toContainEqual(record);
      } else if (oldValue && typeof oldValue === "object") {
        for (const [k, v] of Object.entries(oldValue))
          expect((current as Record<string, unknown>)[k]).toEqual(v);
      } else expect(current).toEqual(oldValue);
    }
  }
  expect(after[storeKeys[0]].projects).toHaveLength(2);
  expect(after[storeKeys[0]].tasks).toHaveLength(2);
  expect(after[storeKeys[0]].customers).toHaveLength(2);
  expect(after[storeKeys[1]].customTools).toHaveLength(2);
  expect(after[storeKeys[1]].entries).toHaveLength(4);
  expect(after[storeKeys[1]].contents).toHaveLength(2);
  expect(after[storeKeys[1]].workflows).toHaveLength(2);
  expect(after[storeKeys[1]].favorites).toHaveLength(3);
  expect(Object.keys(after[storeKeys[1]].costs)).toHaveLength(2);
  expect(after[storeKeys[2]].drafts).toHaveLength(2);
  expect(Object.keys(after[storeKeys[2]].accounts)).toHaveLength(2);
  expect(after[storeKeys[3]].deals).toHaveLength(2);
  expect(Object.keys(after[storeKeys[3]].budgets)).toHaveLength(2);
  expect(target.getItem("unrelated-key")).toBe("must-survive");
  assertUnique(target);
});

test("four-store audit: three repeated imports add no duplicates or storage writes", () => {
  const target = seeded("old", "2026-11");
  const incoming = createBackup(seeded("new", "2026-10"));
  restoreBackup(target, incoming, snapshot(target));
  const complete = snapshot(target);
  const journal = target.getItem(journalKey);
  const writes = target.writes;
  for (let i = 0; i < 3; i++) {
    expect(restoreBackup(target, incoming, snapshot(target))).toBe(false);
    expect(snapshot(target)).toEqual(complete);
    assertUnique(target);
  }
  expect(target.writes).toBe(writes);
  expect(target.getItem(journalKey)).toBe(journal);
});

test("four-store audit: conflict in any namespace prevents every write and preserves all stores", () => {
  for (const key of storeKeys) {
    const target = seeded("same");
    const incoming = createBackup(target);
    if (key === storeKeys[0])
      (incoming.stores[key] as any).tasks[0].name = "conflict";
    if (key === storeKeys[1])
      (incoming.stores[key] as any).entries[0].amount = 1;
    if (key === storeKeys[2])
      (incoming.stores[key] as any).drafts[0].prompt = "conflict";
    if (key === storeKeys[3])
      (incoming.stores[key] as any).budgets["2026-10"] = 1;
    const before = snapshot(target),
      writes = target.writes;
    expect(() => restoreBackup(target, incoming, before)).toThrow();
    expect(snapshot(target)).toEqual(before);
    expect(target.writes).toBe(writes);
    expect(target.getItem(journalKey)).toBeNull();
  }
});

test("four-store audit: failed write in each namespace rolls back all four stores exactly", () => {
  for (const key of storeKeys) {
    const target = seeded("old", "2026-11");
    const before = snapshot(target);
    const incoming = createBackup(seeded("new", "2026-10"));
    target.failOnce = key;
    expect(() => restoreBackup(target, incoming, before)).toThrow("ย้อนกลับ");
    expect(snapshot(target)).toEqual(before);
    expect(previousSnapshot(target)).toEqual(before);
    expect(JSON.parse(target.getItem(journalKey)!).stage).toBe("committed");
    expect(target.getItem("unrelated-key")).toBe("must-survive");
  }
});

test("four-store audit: startup recovery restores every namespace before use after partial corruption", () => {
  const target = seeded("old");
  const before = snapshot(target);
  target.setItem(
    journalKey,
    JSON.stringify({
      version: 1,
      stage: "prepared",
      createdAt: "2026-10-27T00:00:00Z",
      before,
    }),
  );
  for (const key of storeKeys)
    target.setItem(key, JSON.stringify(data("partial")[key]));
  expect(recoverInterruptedRestore(target)).toBe(true);
  expect(snapshot(target)).toEqual(before);
  expect(read(target)).toEqual(data("old"));
  expect(recoverInterruptedRestore(target)).toBe(false);
  expect(target.getItem("unrelated-key")).toBe("must-survive");
});
