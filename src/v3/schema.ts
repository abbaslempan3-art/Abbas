import { safeUrl } from "../features/catalog";
export const storeKeys = [
  "abbas-command-center-v1",
  "abbas-business-v1",
  "abbas-command-center-v2",
  "abbas-workspace-v3",
] as const;
export type StoreKey = (typeof storeKeys)[number];
export type Deal = {
  id: string;
  value: number;
  followUp: string;
  note: string;
};
export type V3Data = {
  version: 3;
  deals: Deal[];
  budgets: Record<string, number>;
};
const obj = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => typeof v === "string";
const amount = (v: unknown) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;
function records(v: unknown, check: (r: Record<string, unknown>) => boolean) {
  return (
    Array.isArray(v) &&
    v.length <= 50000 &&
    v.every((x) => obj(x) && str(x.id) && !!x.id && check(x)) &&
    new Set(v.map((x) => x.id)).size === v.length
  );
}
const fields = (r: Record<string, unknown>, names: string[]) =>
  names.every((k) => str(r[k]));
const optional = (r: Record<string, unknown>, name: string) =>
  r[name] === undefined || str(r[name]);
export function validV3(v: unknown): v is V3Data {
  return (
    obj(v) &&
    v.version === 3 &&
    records(
      v.deals,
      (r) => amount(r.value) && fields(r, ["followUp", "note"]),
    ) &&
    obj(v.budgets) &&
    Object.entries(v.budgets).every(
      ([k, n]) => /^\d{4}-(0[1-9]|1[0-2])$/.test(k) && amount(n),
    )
  );
}
export function validStore(key: StoreKey, v: unknown): boolean {
  if (!obj(v)) return false;
  if (key === storeKeys[0])
    return (
      records(
        v.projects,
        (r) =>
          fields(r, ["name", "description", "status"]) &&
          optional(r, "business"),
      ) &&
      records(
        v.tasks,
        (r) =>
          fields(r, ["name", "project", "due", "priority", "status"]) &&
          optional(r, "department"),
      ) &&
      records(v.customers, (r) => fields(r, ["name", "company", "status"]))
    );
  if (key === storeKeys[1])
    return (
      v.version === 1 &&
      Array.isArray(v.favorites) &&
      v.favorites.every(str) &&
      records(
        v.customTools,
        (r) =>
          fields(r, ["name", "url", "category", "description"]) &&
          safeUrl(r.url as string) &&
          Array.isArray(r.jobs) &&
          r.jobs.every(str),
      ) &&
      obj(v.costs) &&
      Object.values(v.costs).every(amount) &&
      records(
        v.entries,
        (r) =>
          fields(r, ["name", "date", "business"]) &&
          ["income", "expense"].includes(r.kind as string) &&
          amount(r.amount),
      ) &&
      records(v.contents, (r) =>
        fields(r, ["title", "business", "channel", "date", "status", "tool"]),
      ) &&
      records(
        v.workflows,
        (r) =>
          fields(r, ["name", "business"]) &&
          Array.isArray(r.steps) &&
          r.steps.every((s) => obj(s) && fields(s, ["toolId", "instruction"])),
      )
    );
  if (key === storeKeys[2])
    return (
      v.version === 2 &&
      records(v.drafts, (r) =>
        fields(r, ["title", "prompt", "toolId", "department", "createdAt"]),
      ) &&
      obj(v.accounts) &&
      Object.values(v.accounts).every(
        (a) =>
          obj(a) &&
          str(a.trialEnd) &&
          obj(a.usage) &&
          Object.entries(a.usage).every(
            ([m, n]) =>
              /^\d{4}-\d{2}$/.test(m) &&
              Number.isSafeInteger(n) &&
              Number(n) >= 0,
          ),
      )
    );
  return validV3(v);
}
export function assertSafeTree(v: unknown, depth = 0): void {
  if (depth > 40) throw Error("JSON ซ้อนลึกเกินกำหนด");
  if (v && typeof v === "object")
    for (const [k, value] of Object.entries(v)) {
      if (
        ["__proto__", "constructor", "prototype"].includes(k) ||
        /^(api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)$/i.test(
          k,
        )
      )
        throw Error("ไฟล์มี key ที่ไม่ปลอดภัยหรือข้อมูลลับ ไม่อนุญาตให้กู้คืน");
      assertSafeTree(value, depth + 1);
    }
}
