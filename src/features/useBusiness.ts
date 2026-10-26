import { useState } from "react";
import { catalog, safeUrl, type Tool, businesses } from "./catalog";
export type Entry = {
  id: string;
  name: string;
  kind: "income" | "expense";
  amount: number;
  date: string;
  business: string;
};
export type Content = {
  id: string;
  title: string;
  business: string;
  channel: string;
  date: string;
  status: string;
  tool: string;
};
export type Workflow = {
  id: string;
  name: string;
  business: string;
  steps: { toolId: string; instruction: string }[];
};
export type BusinessData = {
  version: 1;
  favorites: string[];
  customTools: Tool[];
  costs: Record<string, number>;
  entries: Entry[];
  contents: Content[];
  workflows: Workflow[];
};
export const businessKey = "abbas-business-v1";
const date = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
export const localDate = date;
const seed: BusinessData = {
  version: 1,
  favorites: [],
  customTools: [],
  costs: {},
  entries: [
    {
      id: "sample-income",
      name: "รายรับโครงการตัวอย่าง",
      kind: "income",
      amount: 15000,
      date: date(),
      business: businesses[0],
    },
    {
      id: "sample-expense",
      name: "ค่าใช้จ่ายผลิตสื่อตัวอย่าง",
      kind: "expense",
      amount: 2500,
      date: date(),
      business: businesses[0],
    },
  ],
  contents: [
    {
      id: "sample-content",
      title: "ไอเดียคลิปเรียนรู้สี (ตัวอย่าง)",
      business: businesses[1],
      channel: "YouTube",
      date: date(),
      status: "ไอเดีย",
      tool: "tool-chatgpt",
    },
  ],
  workflows: [],
};
function valid(d: BusinessData) {
  return (
    d &&
    d.version === 1 &&
    Array.isArray(d.favorites) &&
    d.favorites.every((x) => typeof x === "string") &&
    Array.isArray(d.customTools) &&
    d.customTools.every(
      (t) =>
        t &&
        typeof t.id === "string" &&
        typeof t.name === "string" &&
        typeof t.category === "string" &&
        typeof t.description === "string" &&
        safeUrl(t.url) &&
        Array.isArray(t.jobs) &&
        t.jobs.every((j) => typeof j === "string"),
    ) &&
    d.costs &&
    typeof d.costs === "object" &&
    Object.values(d.costs).every((n) => Number.isFinite(n) && n >= 0) &&
    Array.isArray(d.entries) &&
    d.entries.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.name === "string" &&
        ["income", "expense"].includes(e.kind) &&
        Number.isFinite(e.amount) &&
        e.amount >= 0 &&
        typeof e.date === "string" &&
        typeof e.business === "string",
    ) &&
    Array.isArray(d.contents) &&
    d.contents.every(
      (c) =>
        c &&
        ["id", "title", "business", "channel", "date", "status", "tool"].every(
          (k) => typeof c[k as keyof Content] === "string",
        ),
    ) &&
    Array.isArray(d.workflows) &&
    d.workflows.every(
      (w) =>
        w &&
        typeof w.id === "string" &&
        typeof w.name === "string" &&
        typeof w.business === "string" &&
        Array.isArray(w.steps) &&
        w.steps.every(
          (s) =>
            s &&
            typeof s.toolId === "string" &&
            typeof s.instruction === "string",
        ),
    )
  );
}
export function useBusiness() {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(businessKey);
      if (!raw) return { data: seed, error: "" };
      const data = JSON.parse(raw);
      if (!valid(data)) throw Error();
      return { data: data as BusinessData, error: "" };
    } catch {
      return {
        data: seed,
        error:
          "อ่านข้อมูลส่วนธุรกิจไม่ได้ แสดงตัวอย่างแทน ข้อมูลเดิมจะถูกแทนที่เมื่อบันทึกครั้งต่อไป",
      };
    }
  });
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState(initial.error);
  function save(next: BusinessData) {
    try {
      localStorage.setItem(businessKey, JSON.stringify(next));
      setData(next);
      setError("");
      return true;
    } catch {
      setError(
        "บันทึกข้อมูลธุรกิจไม่สำเร็จ ตรวจสอบสิทธิ์หรือพื้นที่ Local Storage",
      );
      return false;
    }
  }
  return { data, save, error, tools: [...catalog, ...data.customTools] };
}
export type BusinessStore = ReturnType<typeof useBusiness>;
export const money = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(n);
