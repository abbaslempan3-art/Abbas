import { useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  ArrowRight,
  Play,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { businesses } from "./catalog";
import {
  localDate,
  money,
  type BusinessStore,
  type Content,
  type Entry,
  type Workflow,
} from "./useBusiness";
export function Executive({ store }: { store: BusinessStore }) {
  const { data, tools } = store;
  const month = localDate().slice(0, 7);
  const entries = data.entries.filter((e) => e.date.startsWith(month));
  const income = entries
    .filter((e) => e.kind === "income")
    .reduce((s, e) => s + e.amount, 0);
  const expense = entries
    .filter((e) => e.kind === "expense")
    .reduce((s, e) => s + e.amount, 0);
  const cost = Object.values(data.costs).reduce((s, n) => s + n, 0);
  return (
    <section>
      <div className="section-heading">
        <div>
          <h2>มุมมองผู้ประกอบการ</h2>
          <p>ข้อมูลตัวอย่างเดือน {month} · ไม่ใช่ข้อมูลการเงินจริง</p>
        </div>
        <span className="badge green">
          {tools.length} เครื่องมือ · {data.favorites.length} รายการโปรด
        </span>
      </div>
      <div className="executive-grid">
        {[
          ["รายรับตัวอย่าง", money(income)],
          ["รายจ่ายที่บันทึก", money(expense)],
          ["งบเครื่องมือ AI / เดือน", money(cost)],
          [
            "คอนเทนต์ที่วางแผน",
            String(
              data.contents.filter((c) => c.status !== "เผยแพร่แล้ว").length,
            ),
          ],
        ].map(([label, value]) => (
          <div className="panel executive-stat" key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="business-chips">
        {businesses.map((b) => (
          <span key={b}>{b}</span>
        ))}
      </div>
    </section>
  );
}
export function Finance({ store }: { store: BusinessStore }) {
  const { data, save } = store;
  const [month, setMonth] = useState(localDate().slice(0, 7));
  const [business, setBusiness] = useState("");
  const [editor, setEditor] = useState<Entry | null | undefined>();
  const entries = data.entries.filter(
    (e) => e.date.startsWith(month) && (!business || e.business === business),
  );
  const total = (kind: string) =>
    entries.filter((e) => e.kind === kind).reduce((s, e) => s + e.amount, 0);
  const toolCost = Object.values(data.costs).reduce((s, c) => s + c, 0);
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">MONEY & COST CONTROL</span>
          <h2>รู้รายรับ เห็นต้นทุน วางแผนได้ชัดเจน</h2>
          <p>บัญชีทดลอง สกุลเงินบาท ไม่มีการเชื่อมบัญชีธนาคาร</p>
        </div>
        <button className="primary" onClick={() => setEditor(null)}>
          <Plus size={16} />
          เพิ่มรายการเงิน
        </button>
      </div>
      <div className="filter-bar">
        <label>
          เดือนรายงาน
          <input
            type="month"
            required
            value={month}
            onChange={(e) =>
              setMonth(e.target.value || localDate().slice(0, 7))
            }
          />
        </label>
        <BusinessSelect value={business} onChange={setBusiness} all />
      </div>
      <div className="executive-grid">
        {[
          ["รายรับ", total("income")],
          ["รายจ่าย", total("expense")],
          ["คงเหลือจากรายการ", total("income") - total("expense")],
          ["งบ AI รวมทุกธุรกิจ / เดือน", toolCost],
        ].map(([label, amount]) => (
          <div className="panel executive-stat" key={label}>
            <small>{label}</small>
            <strong>{money(Number(amount))}</strong>
          </div>
        ))}
      </div>
      <p className="note">
        งบ AI เป็นค่าใช้จ่ายรายเดือนที่ระบุใน Directory
        ไม่ใช่ราคาจากผู้ให้บริการ และไม่รวมในรายจ่าย/คงเหลือโดยอัตโนมัติ
        เพื่อหลีกเลี่ยงการนับซ้ำ งบ AI
        ไม่กรองตามธุรกิจหรือเดือนและไม่ใช่ประวัติการชำระเงิน
      </p>
      {editor !== undefined && (
        <form
          key={editor?.id || "new"}
          className="panel inline-editor"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const amount = Number(f.get("amount"));
            const name = String(f.get("name")).trim();
            if (!name || !Number.isFinite(amount) || amount <= 0) return;
            const entry: Entry = {
              id: editor?.id || crypto.randomUUID(),
              name,
              amount: Math.round(amount * 100) / 100,
              kind: f.get("kind") as Entry["kind"],
              date: String(f.get("date")),
              business: String(f.get("business")),
            };
            if (
              save({
                ...data,
                entries: editor
                  ? data.entries.map((x) => (x.id === editor.id ? entry : x))
                  : [...data.entries, entry],
              })
            )
              setEditor(undefined);
          }}
        >
          <h3>{editor ? "แก้ไขรายการเงิน" : "รายการเงินใหม่ (ตัวอย่าง)"}</h3>
          <div className="form-grid">
            <label>
              ชื่อรายการ
              <input
                name="name"
                required
                maxLength={150}
                defaultValue={editor?.name}
              />
            </label>
            <label>
              ประเภท
              <select
                aria-label="ประเภท"
                name="kind"
                defaultValue={editor?.kind || "income"}
              >
                <option value="income">รายรับ</option>
                <option value="expense">รายจ่าย</option>
              </select>
            </label>
            <label>
              จำนวนเงิน (บาท)
              <input
                name="amount"
                required
                type="number"
                min="0.01"
                max="100000000"
                step="0.01"
                defaultValue={editor?.amount}
              />
            </label>
            <label>
              วันที่
              <input
                name="date"
                type="date"
                required
                defaultValue={editor?.date || localDate()}
              />
            </label>
            <label>
              ธุรกิจ
              <select name="business" defaultValue={editor?.business}>
                {businesses.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setEditor(undefined)}
            >
              ยกเลิก
            </button>
            <button type="submit" className="primary">
              บันทึกรายการเงิน
            </button>
          </div>
        </form>
      )}
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>รายการ / ธุรกิจ</th>
              <th>วันที่</th>
              <th>ประเภท</th>
              <th>จำนวนเงิน</th>
              <th>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>{e.name}</strong>
                  <small>{e.business}</small>
                </td>
                <td>{e.date}</td>
                <td>
                  <span
                    className={
                      "badge " + (e.kind === "income" ? "green" : "red")
                    }
                  >
                    {e.kind === "income" ? "รายรับ" : "รายจ่าย"}
                  </span>
                </td>
                <td>{money(e.amount)}</td>
                <td>
                  <div className="actions">
                    <button
                      aria-label={"แก้ไขรายการเงิน " + e.name}
                      onClick={() => setEditor(e)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      aria-label={"ลบรายการเงิน " + e.name}
                      onClick={() => {
                        if (confirm("ลบรายการเงินตัวอย่างนี้?"))
                          save({
                            ...data,
                            entries: data.entries.filter((x) => x.id !== e.id),
                          });
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries.length && (
          <div className="empty">ไม่มีรายการในเดือนและธุรกิจที่เลือก</div>
        )}
      </div>
    </section>
  );
}
export function BusinessSelect({
  value,
  onChange,
  all = false,
}: {
  value: string;
  onChange: (s: string) => void;
  all?: boolean;
}) {
  return (
    <label>
      ประเภทธุรกิจ
      <select
        aria-label="ประเภทธุรกิจ"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {all && <option value="">ทุกธุรกิจ</option>}
        {businesses.map((b) => (
          <option key={b}>{b}</option>
        ))}
      </select>
    </label>
  );
}
const contentStates = [
  "ไอเดีย",
  "กำลังผลิต",
  "รอตรวจทาน",
  "พร้อมเผยแพร่",
  "เผยแพร่แล้ว",
];
export function ContentPlanner({ store }: { store: BusinessStore }) {
  const { data, tools, save } = store;
  const [business, setBusiness] = useState("");
  const [status, setStatus] = useState("");
  const [editor, setEditor] = useState<Content | null | undefined>();
  const items = data.contents.filter(
    (c) =>
      (!business || c.business === business) &&
      (!status || c.status === status),
  );
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">CONTENT PRODUCTION</span>
          <h2>จากไอเดีย สู่คอนเทนต์ที่พร้อมเผยแพร่</h2>
          <p>แผนงานเท่านั้น ระบบไม่สร้างหรือโพสต์คอนเทนต์อัตโนมัติ</p>
        </div>
        <button className="primary" onClick={() => setEditor(null)}>
          <Plus size={16} />
          เพิ่มคอนเทนต์
        </button>
      </div>
      <div className="filter-bar">
        <BusinessSelect value={business} onChange={setBusiness} all />
        <label>
          สถานะคอนเทนต์
          <select
            aria-label="สถานะคอนเทนต์"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            {contentStates.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      {editor !== undefined && (
        <form
          key={editor?.id || "new"}
          className="panel inline-editor"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const title = String(f.get("title")).trim();
            if (!title) return;
            const content: Content = {
              id: editor?.id || crypto.randomUUID(),
              title,
              business: String(f.get("business")),
              channel: String(f.get("channel")),
              date: String(f.get("date")),
              status: String(f.get("status")),
              tool: String(f.get("tool")),
            };
            if (
              save({
                ...data,
                contents: editor
                  ? data.contents.map((c) => (c.id === editor.id ? content : c))
                  : [...data.contents, content],
              })
            )
              setEditor(undefined);
          }}
        >
          <h3>{editor ? "แก้ไขคอนเทนต์" : "แผนคอนเทนต์ใหม่"}</h3>
          <label>
            หัวข้อคอนเทนต์
            <input
              name="title"
              required
              maxLength={200}
              defaultValue={editor?.title}
            />
          </label>
          <div className="form-grid">
            <label>
              ธุรกิจ
              <select name="business" defaultValue={editor?.business}>
                {businesses.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
            <label>
              ช่องทาง
              <select
                name="channel"
                defaultValue={editor?.channel || "Facebook"}
              >
                {[
                  "Facebook",
                  "Instagram",
                  "TikTok",
                  "YouTube",
                  "LINE",
                  "เว็บไซต์",
                  "อื่น ๆ",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              วันเผยแพร่ที่วางแผน
              <input
                name="date"
                type="date"
                required
                defaultValue={editor?.date || localDate()}
              />
            </label>
            <label>
              สถานะ
              <select
                name="status"
                defaultValue={editor?.status || contentStates[0]}
              >
                {contentStates.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              เครื่องมือที่วางแผนใช้
              <select name="tool" defaultValue={editor?.tool || ""}>
                <option value="">ยังไม่เลือก</option>
                {tools.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setEditor(undefined)}
            >
              ยกเลิก
            </button>
            <button type="submit" className="primary">
              บันทึกแผนคอนเทนต์
            </button>
          </div>
        </form>
      )}
      <div className="content-board">
        {contentStates.map((s) => (
          <div className="content-column" key={s}>
            <h3>
              {s}
              <span className="count">
                {items.filter((c) => c.status === s).length}
              </span>
            </h3>
            {items
              .filter((c) => c.status === s)
              .map((c) => (
                <article className="panel content-card" key={c.id}>
                  <span className="category-label">
                    {c.channel} · {c.date}
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.business}</p>
                  <small>
                    แผนใช้:{" "}
                    {tools.find((t) => t.id === c.tool)?.name ||
                      (c.tool ? "ไม่พบเครื่องมือเดิม" : "ยังไม่เลือก")}
                  </small>
                  <label className="sr-only" htmlFor={"content-status-" + c.id}>
                    สถานะ {c.title}
                  </label>
                  <select
                    id={"content-status-" + c.id}
                    value={c.status}
                    onChange={(e) =>
                      save({
                        ...data,
                        contents: data.contents.map((x) =>
                          x.id === c.id ? { ...x, status: e.target.value } : x,
                        ),
                      })
                    }
                  >
                    {contentStates.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <div className="actions">
                    <button
                      aria-label={"แก้ไขคอนเทนต์ " + c.title}
                      onClick={() => setEditor(c)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      aria-label={"ลบคอนเทนต์ " + c.title}
                      onClick={() => {
                        if (confirm("ลบแผนคอนเทนต์นี้?"))
                          save({
                            ...data,
                            contents: data.contents.filter(
                              (x) => x.id !== c.id,
                            ),
                          });
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        ))}
      </div>
      {!items.length && <div className="empty">ยังไม่มีคอนเทนต์ตามตัวกรอง</div>}
      <p className="note">
        สำหรับ Kids Content Studio ควรตรวจความเหมาะสมตามวัย ลิขสิทธิ์ภาพ/เสียง
        และนโยบายแพลตฟอร์มก่อนเผยแพร่
        ระบบไม่ส่งข้อมูลเด็กหรือข้อมูลส่วนบุคคลไปยังเครื่องมือใด
      </p>
    </section>
  );
}
export function Workflows({ store }: { store: BusinessStore }) {
  const { data, save, tools } = store;
  const blank = (): Workflow => ({
    id: crypto.randomUUID(),
    name: "",
    business: businesses[0],
    steps: [{ toolId: tools[0].id, instruction: "" }],
  });
  const [draft, setDraft] = useState<Workflow>(blank);
  const [simulation, setSimulation] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  function update(next: Workflow) {
    setDraft(next);
    setSimulation([]);
    setMessage("");
  }
  function simulate() {
    if (
      !draft.name.trim() ||
      !draft.steps.length ||
      draft.steps.some(
        (s) => !s.instruction.trim() || !tools.some((t) => t.id === s.toolId),
      )
    ) {
      setMessage(
        "กรอกชื่อ แผนงานแต่ละขั้น และเลือกเครื่องมือที่ยังมีใน Directory",
      );
      setSimulation([]);
      return;
    }
    setMessage(
      "ผลจำลองแผนเท่านั้น — ไม่มีการเรียก API สร้างผลลัพธ์ AI หรือส่งงานระหว่างเครื่องมือ",
    );
    setSimulation(
      draft.steps.map(
        (s, i) =>
          `${i + 1}. วางแผนใช้ ${tools.find((t) => t.id === s.toolId)?.name}: ${s.instruction}`,
      ),
    );
  }
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">WORKFLOW DESIGN LAB</span>
          <h2>ออกแบบงานอัตโนมัติ เริ่มที่แผนที่ชัดเจน</h2>
          <p>ตัวจำลอง V1 · ไม่ใช่ระบบรัน AI agent หรือส่งงานจริง</p>
        </div>
        <span className="badge neutral">SIMULATION ONLY</span>
      </div>
      <div className="workflow-layout">
        <form
          className="panel inline-editor"
          onSubmit={(e) => {
            e.preventDefault();
            if (
              !draft.name.trim() ||
              draft.steps.some(
                (s) =>
                  !s.instruction.trim() ||
                  !tools.some((t) => t.id === s.toolId),
              )
            ) {
              setMessage(
                "กรอกชื่อและแผนงานให้ครบ และเลือกเครื่องมือที่ยังอยู่ใน Directory",
              );
              return;
            }
            if (
              save({
                ...data,
                workflows: data.workflows.some((w) => w.id === draft.id)
                  ? data.workflows.map((w) => (w.id === draft.id ? draft : w))
                  : [...data.workflows, draft],
              })
            )
              setMessage("บันทึกแผนแล้ว ยังไม่ได้เรียกใช้งานเครื่องมือ");
          }}
        >
          <div className="section-heading">
            <h3>แผน Workflow</h3>
            <button
              type="button"
              className="text-button"
              onClick={() => update(blank())}
            >
              สร้างแผนใหม่
            </button>
          </div>
          <label>
            ชื่อ Workflow
            <input
              required
              maxLength={150}
              value={draft.name}
              onChange={(e) => update({ ...draft, name: e.target.value })}
            />
          </label>
          <BusinessSelect
            value={draft.business}
            onChange={(business) => update({ ...draft, business })}
          />
          <div className="workflow-steps">
            {draft.steps.map((s, i) => (
              <div className="workflow-step" key={i}>
                <div className="step-number">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <label>
                    เครื่องมือขั้นที่ {i + 1}
                    <select
                      aria-label={"เครื่องมือขั้นที่ " + (i + 1)}
                      value={s.toolId}
                      onChange={(e) =>
                        update({
                          ...draft,
                          steps: draft.steps.map((x, j) =>
                            i === j ? { ...x, toolId: e.target.value } : x,
                          ),
                        })
                      }
                    >
                      {!tools.some((t) => t.id === s.toolId) && (
                        <option value={s.toolId}>
                          ไม่พบเครื่องมือเดิม — กรุณาเลือกใหม่
                        </option>
                      )}
                      {tools.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    แผนงานขั้นที่ {i + 1}
                    <textarea
                      aria-label={"แผนงานขั้นที่ " + (i + 1)}
                      required
                      maxLength={1000}
                      placeholder="เช่น ร่างแผนคอนเทนต์ด้วยข้อมูลสมมติ"
                      value={s.instruction}
                      onChange={(e) =>
                        update({
                          ...draft,
                          steps: draft.steps.map((x, j) =>
                            i === j ? { ...x, instruction: e.target.value } : x,
                          ),
                        })
                      }
                    />
                  </label>
                  <div className="actions">
                    <button
                      type="button"
                      disabled={i === 0}
                      aria-label={"ย้ายขั้น " + (i + 1) + " ขึ้น"}
                      onClick={() => {
                        const steps = [...draft.steps];
                        [steps[i - 1], steps[i]] = [steps[i], steps[i - 1]];
                        update({ ...draft, steps });
                      }}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={i === draft.steps.length - 1}
                      aria-label={"ย้ายขั้น " + (i + 1) + " ลง"}
                      onClick={() => {
                        const steps = [...draft.steps];
                        [steps[i], steps[i + 1]] = [steps[i + 1], steps[i]];
                        update({ ...draft, steps });
                      }}
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={draft.steps.length === 1}
                      aria-label={"ลบขั้น " + (i + 1)}
                      onClick={() =>
                        update({
                          ...draft,
                          steps: draft.steps.filter((_, j) => j !== i),
                        })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="secondary"
            disabled={draft.steps.length >= 12}
            onClick={() =>
              update({
                ...draft,
                steps: [
                  ...draft.steps,
                  { toolId: tools[0].id, instruction: "" },
                ],
              })
            }
          >
            <Plus size={15} /> เพิ่มขั้นตอน
          </button>
          <div className="form-actions">
            <button type="button" className="secondary" onClick={simulate}>
              <Play size={14} /> จำลองแผน
            </button>
            <button type="submit" className="primary">
              บันทึก Workflow
            </button>
          </div>
        </form>
        <div>
          <div className="panel simulation">
            <h3>ผลการจำลอง</h3>
            <p role="status">
              {message || "ยังไม่ได้จำลอง เลือกเครื่องมือและเขียนแผนก่อนเริ่ม"}
            </p>
            {simulation.map((s, i) => (
              <div className="simulation-step" key={i}>
                <ArrowRight size={16} />
                <p>{s}</p>
              </div>
            ))}
          </div>
          <div className="panel saved-workflows">
            <h3>Workflow ที่บันทึก ({data.workflows.length})</h3>
            {data.workflows.map((w) => (
              <div className="saved-workflow" key={w.id}>
                <button
                  aria-label={"เปิด Workflow " + w.name}
                  onClick={() => update(w)}
                >
                  <strong>{w.name}</strong>
                  <small>
                    {w.business} · {w.steps.length} ขั้น
                  </small>
                </button>
                <button
                  aria-label={"ลบ Workflow " + w.name}
                  onClick={() => {
                    if (
                      confirm("ลบแผน Workflow นี้?") &&
                      save({
                        ...data,
                        workflows: data.workflows.filter((x) => x.id !== w.id),
                      })
                    ) {
                      if (draft.id === w.id) update(blank());
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
export function IntegrationSettings({ store }: { store: BusinessStore }) {
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">CONNECTIONS & TRUST</span>
          <h2>การเชื่อมต่อที่ตรวจสอบได้ เริ่มจากความชัดเจน</h2>
          <p>
            V1 ไม่มีการเชื่อมต่อจริง ไม่มี OAuth session และไม่เก็บ API keys
          </p>
        </div>
        <span className="badge neutral">เชื่อมต่อจริง 0 รายการ</span>
      </div>
      <div className="report-grid">
        <article className="panel report-card">
          <h3>ข้อมูลและความปลอดภัย</h3>
          <p className="muted">
            ข้อมูลทั้งหมดเป็นตัวอย่าง จัดเก็บเฉพาะเบราว์เซอร์และ origin นี้
            ไม่มีการเข้ารหัสหรือสำรองข้อมูล อย่าใส่ข้อมูลส่วนตัว
            ข้อมูลลูกค้าจริง token หรือ API keys
          </p>
          <div className="report-row">
            <span>ที่จัดเก็บ</span>
            <strong>Local Storage</strong>
          </div>
          <div className="report-row">
            <span>ส่งข้อมูลไป AI</span>
            <strong>ไม่ส่ง</strong>
          </div>
        </article>
        <article className="panel report-card">
          <h3>เตรียม Backend สำหรับอนาคต</h3>
          <p className="muted">
            โครงสร้าง backend/ มี health check และ API contract เท่านั้น OAuth
            endpoints ตอบ 501 จนกว่าจะติดตั้งผู้ให้บริการ ระบบบัญชีผู้ใช้ และ
            secret vault ฝั่ง server
          </p>
          <p className="note">
            Frontend ไม่สามารถยืนยันการเชื่อมต่อด้วยตัวเอง สถานะ “เชื่อมต่อแล้ว”
            ต้องมาจากการตรวจสิทธิ์บน server ในอนาคต
          </p>
        </article>
      </div>
      <div className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>เครื่องมือ</th>
              <th>ประเภท</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {store.tools.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong>
                </td>
                <td>ลิงก์เว็บไซต์เท่านั้น</td>
                <td>
                  <span className="badge neutral">
                    ยังไม่เชื่อมต่อ · ยังไม่ตรวจสอบสิทธิ์
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
