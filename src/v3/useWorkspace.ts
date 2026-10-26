import { useState } from "react";
import { validV3, type V3Data, storeKeys } from "./schema";
const key = storeKeys[3];
export function useWorkspace() {
  const [initial] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      const data = raw
        ? JSON.parse(raw)
        : { version: 3, deals: [], budgets: {} };
      if (!validV3(data)) throw Error();
      return { data: data as V3Data, raw, locked: false };
    } catch {
      return {
        data: { version: 3, deals: [], budgets: {} } as V3Data,
        raw: null,
        locked: true,
      };
    }
  });
  const [data, setData] = useState(initial.data);
  const [raw, setRaw] = useState(initial.raw);
  const [error, setError] = useState(
    initial.locked ? "อ่าน V3 ไม่ได้ ปิดการบันทึกเพื่อรักษาข้อมูลเดิม" : "",
  );
  function save(next: V3Data) {
    if (initial.locked) return false;
    try {
      if (localStorage.getItem(key) !== raw)
        throw Error("ข้อมูลเปลี่ยนจากอีกแท็บ กรุณาโหลดใหม่ก่อนบันทึก");
      if (!validV3(next)) throw Error("ข้อมูล V3 ไม่ถูกต้อง");
      const text = JSON.stringify(next);
      localStorage.setItem(key, text);
      setRaw(text);
      setData(next);
      setError("");
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "บันทึกไม่สำเร็จ");
      return false;
    }
  }
  return { data, save, error, locked: initial.locked };
}
export type WorkspaceStore = ReturnType<typeof useWorkspace>;
