import { useState } from "react";
import { localDate } from "../features/useBusiness";
export type CommandDraft = {
  id: string;
  title: string;
  prompt: string;
  toolId: string;
  department: string;
  createdAt: string;
};
export type AccountNote = { trialEnd: string; usage: Record<string, number> };
export type V2Data = {
  version: 2;
  drafts: CommandDraft[];
  accounts: Record<string, AccountNote>;
};
export const v2Key = "abbas-command-center-v2";
const blank: V2Data = { version: 2, drafts: [], accounts: {} };
function valid(d: V2Data) {
  return (
    d?.version === 2 &&
    Array.isArray(d.drafts) &&
    d.drafts.every(
      (x) =>
        x &&
        ["id", "title", "prompt", "toolId", "department", "createdAt"].every(
          (k) => typeof x[k as keyof CommandDraft] === "string",
        ),
    ) &&
    d.accounts &&
    typeof d.accounts === "object" &&
    !Array.isArray(d.accounts) &&
    Object.values(d.accounts).every(
      (x) =>
        x &&
        typeof x.trialEnd === "string" &&
        (x.trialEnd === "" || /^\d{4}-\d{2}-\d{2}$/.test(x.trialEnd)) &&
        x.usage &&
        typeof x.usage === "object" &&
        !Array.isArray(x.usage) &&
        Object.entries(x.usage).every(
          ([month, n]) =>
            /^\d{4}-\d{2}$/.test(month) && Number.isSafeInteger(n) && n >= 0,
        ),
    )
  );
}
export function useV2() {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(v2Key);
      if (!raw)
        return {
          data: blank,
          raw: null as string | null,
          locked: false,
          error: "",
        };
      const d = JSON.parse(raw);
      if (!valid(d)) throw Error();
      return { data: d as V2Data, raw, locked: false, error: "" };
    } catch {
      return {
        data: blank,
        raw: null,
        locked: true,
        error:
          "ข้อมูล V2 อ่านไม่ได้ ปิดการบันทึกเพื่อรักษาข้อมูลเดิม กรุณาสำรองและตรวจข้อมูลก่อน ข้อมูล V1 ไม่ถูกแก้ไข",
      };
    }
  });
  const [data, setData] = useState(initial.data);
  const [raw, setRaw] = useState(initial.raw);
  const [error, setError] = useState(initial.error);
  function save(next: V2Data) {
    if (initial.locked) return false;
    try {
      if (localStorage.getItem(v2Key) !== raw) {
        setError(
          "ข้อมูล V2 เปลี่ยนจากอีกแท็บ กรุณาโหลดหน้าใหม่ก่อนบันทึก เพื่อไม่เขียนทับข้อมูลล่าสุด",
        );
        return false;
      }
      const text = JSON.stringify(next);
      localStorage.setItem(v2Key, text);
      setRaw(text);
      setData(next);
      setError("");
      return true;
    } catch {
      setError(
        "บันทึก V2 ไม่สำเร็จ ตรวจพื้นที่หรือสิทธิ์ Local Storage ข้อมูลเดิมยังอยู่",
      );
      return false;
    }
  }
  return {
    data,
    save,
    error,
    locked: initial.locked,
    month: localDate().slice(0, 7),
  };
}
export type V2Store = ReturnType<typeof useV2>;
