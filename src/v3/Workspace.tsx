import { useState } from "react";
import { type BusinessTask, departments } from "../v2/providers";
import { type V2Store } from "../v2/useV2";
import { localDate, money, type BusinessStore } from "../features/useBusiness";
import { type WorkspaceStore } from "./useWorkspace";
type Customer = { id: string; name: string; company: string; status: string };
export function Workspace({
  tasks,
  customers,
  business,
  v2,
  workspace,
  onAddTask,
  onOpen,
  onCustomers,
}: {
  tasks: BusinessTask[];
  customers: Customer[];
  business: BusinessStore;
  v2: V2Store;
  workspace: WorkspaceStore;
  onAddTask: () => void;
  onOpen: (page: "tasks" | "customers" | "finance" | "command") => void;
  onCustomers: (customers: Customer[]) => boolean;
}) {
  const [tab, setTab] = useState("tasks");
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [message, setMessage] = useState("");
  const [customer, setCustomer] = useState(customers[0]?.id || "");
  const entries = business.data.entries.filter((e) => e.date.startsWith(month));
  const income = entries
    .filter((e) => e.kind === "income")
    .reduce((s, e) => s + e.amount, 0);
  const expense = entries
    .filter((e) => e.kind === "expense")
    .reduce((s, e) => s + e.amount, 0);
  const budget = workspace.data.budgets[month];
  const deal = workspace.data.deals.find((d) => d.id === customer);
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">ABBAS V3 · BUSINESS WORKSPACE</span>
          <h2>ติดตามงาน เงิน และลูกค้า ในพื้นที่เดียว</h2>
          <p>
            ต่อยอดจากข้อมูล V1/V2 · ใช้ข้อมูลสมมติเท่านั้น · ไม่มีการเรียก API
            หรือเปิดบริการเสียเงิน
          </p>
        </div>
        <button className="primary" onClick={onAddTask}>
          เพิ่มงาน
        </button>
      </div>
      <div className="v3-tabs" role="tablist" aria-label="พื้นที่ทำงาน V3">
        {[
          ["tasks", "ติดตามงาน"],
          ["finance", "แผนการเงิน"],
          ["crm", "ติดตามลูกค้า"],
          ["ai", "AI Brief"],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            id={"tab-" + id}
            aria-controls={"panel-" + id}
            aria-selected={tab === id}
            onClick={() => {
              setTab(id);
              setMessage("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div
        className="panel v3-work-panel"
        role="tabpanel"
        id={"panel-" + tab}
        aria-labelledby={"tab-" + tab}
      >
        {tab === "tasks" && (
          <>
            <div className="section-heading">
              <div>
                <h3>งานครบกำหนดและงานค้าง</h3>
                <p className="muted">
                  ครบกำหนดวันนี้{" "}
                  {
                    tasks.filter(
                      (t) => t.due === localDate() && t.status !== "เสร็จแล้ว",
                    ).length
                  }{" "}
                  · เลยกำหนด{" "}
                  {
                    tasks.filter(
                      (t) =>
                        t.due &&
                        t.due < localDate() &&
                        t.status !== "เสร็จแล้ว",
                    ).length
                  }{" "}
                  · งานค้าง{" "}
                  {tasks.filter((t) => t.status !== "เสร็จแล้ว").length}
                </p>
              </div>
              <button className="text-button" onClick={() => onOpen("tasks")}>
                จัดการงานทั้งหมด →
              </button>
            </div>
            <label className="search">
              <input
                aria-label="ค้นหางาน V3"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางานค้าง"
              />
            </label>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>งานค้าง</th>
                    <th>กำหนด</th>
                    <th>ฝ่าย</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks
                    .filter(
                      (t) =>
                        t.status !== "เสร็จแล้ว" &&
                        t.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .sort((a, b) =>
                      (a.due || "9999").localeCompare(b.due || "9999"),
                    )
                    .map((t) => (
                      <tr key={t.id}>
                        <td>
                          <strong>{t.name}</strong>
                        </td>
                        <td
                          className={
                            t.due && t.due < localDate() ? "overdue" : ""
                          }
                        >
                          {t.due || "ไม่ระบุ"}
                        </td>
                        <td>{t.department || "ยังไม่จัดฝ่าย"}</td>
                        <td>{t.status}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {tab === "finance" && (
          <>
            <div className="section-heading">
              <h3>แผนรายเดือนจากรายการเงินเดิม</h3>
              <button className="text-button" onClick={() => onOpen("finance")}>
                จัดการรายรับ–รายจ่าย →
              </button>
            </div>
            <label>
              เดือนการเงิน V3
              <input
                aria-label="เดือนการเงิน V3"
                type="month"
                value={month}
                onChange={(e) =>
                  setMonth(e.target.value || localDate().slice(0, 7))
                }
              />
            </label>
            <div className="executive-grid">
              {[
                ["รายรับตัวอย่าง", money(income)],
                ["รายจ่ายตัวอย่าง", money(expense)],
                ["คงเหลือ", money(income - expense)],
                [
                  "งบรายจ่ายที่กำหนด",
                  budget === undefined ? "ยังไม่กำหนด" : money(budget),
                ],
              ].map(([label, value]) => (
                <div className="executive-stat" key={label}>
                  <small>{label}</small>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <form
              key={month}
              onSubmit={(e) => {
                e.preventDefault();
                const n = Number(new FormData(e.currentTarget).get("budget"));
                if (
                  Number.isFinite(n) &&
                  n >= 0 &&
                  workspace.save({
                    ...workspace.data,
                    budgets: {
                      ...workspace.data.budgets,
                      [month]: Math.round(n * 100) / 100,
                    },
                  })
                )
                  setMessage("บันทึกงบรายเดือนแล้ว รายการเงินเดิมไม่เปลี่ยน");
              }}
            >
              <label>
                งบรายจ่าย V3 (บาท)
                <input
                  name="budget"
                  type="number"
                  min="0"
                  max="100000000"
                  step="0.01"
                  required
                  defaultValue={budget ?? ""}
                />
              </label>
              <button className="primary" disabled={workspace.locked}>
                บันทึกงบรายเดือน
              </button>
            </form>
            <p className="note">
              {budget === undefined
                ? "กำหนดงบก่อนเปรียบเทียบ"
                : expense > budget
                  ? "รายจ่ายตัวอย่างเกินงบ " + money(expense - budget)
                  : "งบที่ยังเหลือ " + money(budget - expense)}{" "}
              · ไม่รวมงบ AI อัตโนมัติ ไม่ใช่บัญชีหรือรายงานภาษีจริง
            </p>
          </>
        )}
        {tab === "crm" && (
          <>
            <div className="section-heading">
              <h3>มูลค่าโอกาสขายและวันติดตาม</h3>
              <button
                className="text-button"
                onClick={() => onOpen("customers")}
              >
                จัดการ CRM เดิม →
              </button>
            </div>
            {!customers.length ? (
              <p className="empty">เพิ่มลูกค้าสมมติใน CRM ก่อนเริ่มติดตาม</p>
            ) : (
              <>
                <label>
                  ลูกค้า V3
                  <select
                    aria-label="ลูกค้า V3"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  สถานะการขาย V3
                  <select
                    aria-label="สถานะการขาย V3"
                    value={
                      customers.find((c) => c.id === customer)?.status ||
                      "ลูกค้าใหม่"
                    }
                    onChange={(e) =>
                      onCustomers(
                        customers.map((c) =>
                          c.id === customer
                            ? { ...c, status: e.target.value }
                            : c,
                        ),
                      )
                    }
                  >
                    {["ลูกค้าใหม่", "กำลังเจรจา", "ปิดการขาย", "ไม่สำเร็จ"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      ),
                    )}
                  </select>
                </label>
                <form
                  key={customer}
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const value = Number(f.get("value"));
                    if (!Number.isFinite(value) || value < 0) return;
                    const next = {
                      id: customer,
                      value: Math.round(value * 100) / 100,
                      followUp: String(f.get("followUp")),
                      note: String(f.get("note")).trim(),
                    };
                    if (
                      workspace.save({
                        ...workspace.data,
                        deals: deal
                          ? workspace.data.deals.map((d) =>
                              d.id === customer ? next : d,
                            )
                          : [...workspace.data.deals, next],
                      })
                    )
                      setMessage("บันทึกแผนติดตามแล้ว ไม่สร้างรายรับอัตโนมัติ");
                  }}
                >
                  <div className="form-grid">
                    <label>
                      มูลค่าโอกาสขาย (บาท)
                      <input
                        name="value"
                        type="number"
                        min="0"
                        max="100000000"
                        step="0.01"
                        required
                        defaultValue={deal?.value ?? 0}
                      />
                    </label>
                    <label>
                      วันติดตามลูกค้า
                      <input
                        name="followUp"
                        type="date"
                        defaultValue={deal?.followUp || ""}
                      />
                    </label>
                  </div>
                  <label>
                    บันทึกติดตาม (ข้อมูลสมมติ)
                    <textarea
                      name="note"
                      maxLength={1500}
                      defaultValue={deal?.note || ""}
                    />
                  </label>
                  <button className="primary" disabled={workspace.locked}>
                    บันทึกการติดตามลูกค้า
                  </button>
                </form>
              </>
            )}
            <div className="v3-followups">
              <h4>รายการติดตามที่ถึงกำหนด</h4>
              {workspace.data.deals
                .filter(
                  (d) =>
                    d.followUp &&
                    d.followUp <= localDate() &&
                    customers.some(
                      (c) =>
                        c.id === d.id &&
                        !["ปิดการขาย", "ไม่สำเร็จ"].includes(c.status),
                    ),
                )
                .map((d) => (
                  <p key={d.id}>
                    {customers.find((c) => c.id === d.id)?.name} · {d.followUp}{" "}
                    · {money(d.value)}
                  </p>
                ))}
            </div>
            <p className="muted">
              มูลค่าโอกาสขายไม่ใช่รายได้
              และไม่มีการส่งข้อความหรือแจ้งเตือนลูกค้าอัตโนมัติ
            </p>
          </>
        )}
        {tab === "ai" && (
          <>
            <h3>สร้างร่างคำสั่งจากแบบฟอร์มธุรกิจ</h3>
            <p className="muted">
              บันทึกเป็นร่าง V2 เท่านั้น ไม่ส่งให้ AI
              ไม่แนบข้อมูลลูกค้า/ธุรกรรมจากระบบ
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                const title = String(f.get("title")).trim();
                const goal = String(f.get("goal")).trim();
                if (!title || !goal) return;
                const department = String(f.get("department"));
                const draft = {
                  id: crypto.randomUUID(),
                  title,
                  department,
                  toolId: String(f.get("toolId")),
                  createdAt: new Date().toISOString(),
                  prompt: `คุณเป็นผู้ช่วยงาน${department}\nเป้าหมายสมมติ: ${goal}\nโปรดเสนอแผนงาน 3 ขั้น ตัวชี้วัด และข้อสมมติที่ต้องตรวจสอบ โดยใช้ข้อมูลสมมติ ไม่เปิดบริการเสียเงินหรือดำเนินการจริง`,
                };
                if (v2.save({ ...v2.data, drafts: [draft, ...v2.data.drafts] }))
                  setMessage(
                    "สร้างร่างใน V2 แล้ว ยังไม่ได้ส่ง AI เปิด AI Command Center แล้วเลือกร่างที่บันทึก",
                  );
              }}
            >
              <label>
                ชื่อ AI Brief
                <input name="title" required maxLength={150} />
              </label>
              <div className="form-grid">
                <label>
                  ฝ่าย AI Brief
                  <select name="department">
                    {departments.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <label>
                  เครื่องมือ AI Brief
                  <select name="toolId">
                    {business.tools.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                เป้าหมายสมมติ
                <textarea name="goal" required maxLength={3000} />
              </label>
              <div className="form-actions">
                <button
                  className="secondary"
                  type="button"
                  onClick={() => onOpen("command")}
                >
                  เปิด Command Center
                </button>
                <button className="primary" disabled={v2.locked}>
                  สร้างร่าง AI Brief
                </button>
              </div>
            </form>
          </>
        )}
        {message && (
          <p role="status" className="note">
            {message}
          </p>
        )}
      </div>
    </section>
  );
}
