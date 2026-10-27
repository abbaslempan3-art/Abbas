import { useState } from "react";

type Task = { id: string; name: string; due: string; status: string; priority: string };
type Customer = { id: string; name: string; status: string };
type Deal = { id: string; followUp: string; value: number; note: string };

const localDay = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
};

export function SecretaryBrief({ tasks, customers, deals }: {
  tasks: Task[]; customers: Customer[]; deals: Deal[];
}) {
  const [copied, setCopied] = useState(false);
  const today = localDay();
  const pending = tasks.filter(t => t.status !== "เสร็จแล้ว");
  const due = pending.filter(t => t.due && t.due <= today).sort((a, b) => a.due.localeCompare(b.due));
  const followups = deals.filter(d => d.followUp && d.followUp <= today).filter(d => {
    const c = customers.find(c => c.id === d.id);
    return c && !["ปิดการขาย", "ไม่สำเร็จ"].includes(c.status);
  }).sort((a, b) => a.followUp.localeCompare(b.followUp));
  const brief = [
    "ABBAS AI Secretary — สรุปจากข้อมูลในเบราว์เซอร์",
    "วันที่ " + today,
    "งานค้าง " + pending.length + " | งานถึงกำหนด/เกินกำหนด " + due.length + " | ลูกค้าต้องติดตาม " + followups.length,
    "",
    "งานที่ต้องจัดการ:",
    ...(due.length ? due.map(t => "- " + t.name + " (" + t.due + ", " + t.priority + ")") : ["- ไม่มีงานถึงกำหนด"]),
    "",
    "ลูกค้าที่ต้องติดตาม:",
    ...(followups.length ? followups.map(d => {
      const c = customers.find(c => c.id === d.id)!;
      return "- " + c.name + " (" + d.followUp + ", " + c.status + ")" + (d.note ? ": " + d.note : "");
    }) : ["- ไม่มีลูกค้าที่ถึงกำหนด"]),
    "",
    "หมายเหตุ: รายงานนี้เป็นข้อมูลเฉพาะเบราว์เซอร์ ไม่ได้ส่งข้อความหาลูกค้าและไม่ได้เชื่อมต่อ AI API"
  ].join("\n");
  return (
    <section className="panel" aria-label="สรุปงานเลขา AI">
      <div className="section-heading">
        <div><h2>อามีน่า · สรุปงานเลขา AI</h2><p>อ่านข้อมูลปัจจุบันจากเบราว์เซอร์นี้เท่านั้น · ไม่เสียค่า API</p></div>
      </div>
      <div className="executive-grid">
        <div className="executive-stat"><small>งานค้าง</small><strong>{pending.length}</strong></div>
        <div className="executive-stat"><small>งานถึงกำหนด</small><strong>{due.length}</strong></div>
        <div className="executive-stat"><small>ลูกค้าต้องติดตาม</small><strong>{followups.length}</strong></div>
      </div>
      <label htmlFor="secretary-brief-text">รายงานที่พร้อมนำไปใช้</label>
      <textarea id="secretary-brief-text" readOnly value={brief} rows={12} style={{ width: "100%" }} />
      <button className="primary" onClick={async () => {
        try { await navigator.clipboard.writeText(brief); setCopied(true); }
        catch { setCopied(false); }
      }}>{copied ? "คัดลอกแล้ว" : "คัดลอกรายงาน"}</button>
      <p className="muted">ไม่ส่งข้อมูลออกจากเว็บไซต์อัตโนมัติ การแจ้งเตือน ChatGPT ไม่สามารถอ่านข้อมูลในเบราว์เซอร์นี้ได้โดยตรง</p>
    </section>
  );
}
