import { useState } from "react";
import { ArrowUpRight, Plus, Star, Pencil, Trash2, Search } from "lucide-react";
import { businesses, categories, jobs, safeUrl, type Tool } from "./catalog";
import { money, type BusinessStore } from "./useBusiness";
const suggestions: Record<string, string[]> = {
  [businesses[0]]: ["ChatGPT", "Canva", "Metricool", "HubSpot", "Make"],
  [businesses[1]]: ["ChatGPT", "Leonardo AI", "CapCut", "ElevenLabs", "Canva"],
  [businesses[2]]: ["Perplexity", "HubSpot", "Canva", "Airtable", "Make"],
  [businesses[3]]: ["ChatGPT", "Canva", "Looker Studio", "Airtable", "n8n"],
  [businesses[4]]: ["NotebookLM", "Notion AI", "Fathom", "Codex", "Zapier"],
};
export function ToolDirectory({ store }: { store: BusinessStore }) {
  const { data, save, tools } = store;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [favorites, setFavorites] = useState(false);
  const [business, setBusiness] = useState("");
  const [job, setJob] = useState("");
  const [editor, setEditor] = useState<Tool | null | undefined>(undefined);
  const [formError, setFormError] = useState("");
  const filtered = tools.filter(
    (t) =>
      (t.name + " " + t.description)
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (!category || t.category === category) &&
      (!favorites || data.favorites.includes(t.id)) &&
      (!job || t.jobs.includes(job)) &&
      (!business || suggestions[business]?.includes(t.name)),
  );
  const remove = (t: Tool) => {
    if (
      !confirm(
        "ลบเครื่องมือที่เพิ่มเองนี้? รายการคอนเทนต์หรือ workflow จะเก็บชื่ออ้างอิงที่ไม่พบไว้",
      )
    )
      return;
    const costs = { ...data.costs };
    delete costs[t.id];
    save({
      ...data,
      customTools: data.customTools.filter((x) => x.id !== t.id),
      favorites: data.favorites.filter((x) => x !== t.id),
      costs,
    });
  };
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">AI TOOLKIT · {tools.length} TOOLS</span>
          <h2>เลือก AI ที่ใช่ ให้ธุรกิจไปได้ไกลกว่า</h2>
          <p>
            ทุกเครื่องมือเป็นเพียงลิงก์ ยังไม่ได้เชื่อมต่อหรือทดสอบสิทธิ์ใช้งาน
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEditor(null);
            setFormError("");
          }}
        >
          <Plus size={16} />
          เพิ่มเครื่องมือ
        </button>
      </div>
      <div className="filter-bar">
        <label className="search">
          <Search size={16} />
          <input
            aria-label="ค้นหาเครื่องมือ"
            placeholder="ค้นหาชื่อหรือความสามารถ…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          หมวดเครื่องมือ
          <select
            aria-label="หมวดเครื่องมือ"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">ทั้งหมด 6 หมวด</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <button
          className={
            "secondary favorite-filter " + (favorites ? "selected" : "")
          }
          aria-pressed={favorites}
          onClick={() => setFavorites(!favorites)}
        >
          <Star size={15} />
          รายการโปรด ({data.favorites.length})
        </button>
      </div>
      <div className="recommendation panel">
        <SparkleHeading />
        <p>
          คำแนะนำจากกฎตามประเภทงานและบริบทธุรกิจ ไม่ได้เรียก AI
          หรือจัดอันดับคุณภาพของผู้ให้บริการ
        </p>
        <div className="filter-bar">
          <label>
            ประเภทธุรกิจ
            <select
              aria-label="ประเภทธุรกิจ"
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
            >
              <option value="">ทุกธุรกิจ</option>
              {businesses.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label>
            ประเภทงาน
            <select
              aria-label="ประเภทงาน"
              value={job}
              onChange={(e) => setJob(e.target.value)}
            >
              <option value="">ทุกประเภทงาน</option>
              {jobs.map((j) => (
                <option key={j}>{j}</option>
              ))}
            </select>
          </label>
          <button
            className="text-button"
            onClick={() => {
              setQuery("");
              setCategory("");
              setFavorites(false);
              setBusiness("");
              setJob("");
            }}
          >
            ล้างตัวกรอง
          </button>
        </div>
        {business === businesses[1] && (
          <p>
            คอนเทนต์เด็ก: ตรวจความเหมาะสมตามวัย ลิขสิทธิ์ และเสียงก่อนเผยแพร่
            ใช้ข้อมูลสมมติเท่านั้น
          </p>
        )}
      </div>
      {editor !== undefined && (
        <form
          key={editor?.id || "new"}
          className="panel inline-editor"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const name = String(f.get("name")).trim();
            const url = String(f.get("url")).trim();
            if (!name || !safeUrl(url)) {
              setFormError(
                "กรอกชื่อและ HTTPS URL สาธารณะ ห้ามมี credentials, query หรือ fragment",
              );
              return;
            }
            if (
              tools.some(
                (t) =>
                  t.id !== editor?.id &&
                  t.name.toLowerCase() === name.toLowerCase(),
              )
            ) {
              setFormError("มีชื่อเครื่องมือนี้แล้ว");
              return;
            }
            const tool: Tool = {
              id: editor?.id || crypto.randomUUID(),
              name,
              url,
              description: String(f.get("description")).trim(),
              category: String(f.get("category")),
              jobs: [String(f.get("job"))],
              custom: true,
            };
            if (
              save({
                ...data,
                customTools: editor
                  ? data.customTools.map((t) => (t.id === editor.id ? tool : t))
                  : [...data.customTools, tool],
              })
            ) {
              setEditor(undefined);
              setFormError("");
            }
          }}
        >
          <h3>{editor ? "แก้ไขเครื่องมือ" : "เพิ่มเครื่องมือของคุณ"}</h3>
          <p className="muted">
            ใช้ลิงก์เว็บไซต์สาธารณะเท่านั้น อย่ากรอก API key, token
            หรือข้อมูลลับ การเพิ่มไม่ได้เชื่อมต่อบริการ
          </p>
          <div className="form-grid">
            <label>
              ชื่อเครื่องมือ
              <input
                name="name"
                required
                maxLength={100}
                defaultValue={editor?.name}
              />
            </label>
            <label>
              เว็บไซต์ HTTPS
              <input
                name="url"
                type="url"
                required
                maxLength={300}
                defaultValue={editor?.url}
              />
            </label>
            <label>
              หมวด
              <select name="category" defaultValue={editor?.category}>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              ประเภทงาน
              <select name="job" defaultValue={editor?.jobs[0]}>
                {jobs.map((j) => (
                  <option key={j}>{j}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            รายละเอียด
            <input
              name="description"
              maxLength={300}
              defaultValue={editor?.description}
            />
          </label>
          {formError && (
            <p role="alert" className="error">
              {formError}
            </p>
          )}
          <div className="form-actions">
            <button
              type="button"
              className="secondary"
              onClick={() => setEditor(undefined)}
            >
              ยกเลิก
            </button>
            <button className="primary" type="submit">
              บันทึกเครื่องมือ
            </button>
          </div>
        </form>
      )}
      <div className="section-heading">
        <h2>
          เครื่องมือที่พบ <span className="count">{filtered.length}</span>
        </h2>
        <span className="muted">
          ค่าใช้จ่ายเป็นงบตัวอย่างที่คุณระบุเอง (บาท/เดือน)
        </span>
      </div>
      <div className="directory-grid">
        {filtered.map((t) => (
          <article className="tool directory-card" key={t.id}>
            <div className="tool-heading">
              <span className="tool-logo">{t.name.slice(0, 1)}</span>
              <button
                className={
                  data.favorites.includes(t.id) ? "star starred" : "star"
                }
                aria-label={"รายการโปรด " + t.name}
                aria-pressed={data.favorites.includes(t.id)}
                onClick={() =>
                  save({
                    ...data,
                    favorites: data.favorites.includes(t.id)
                      ? data.favorites.filter((x) => x !== t.id)
                      : [...data.favorites, t.id],
                  })
                }
              >
                <Star
                  size={18}
                  fill={data.favorites.includes(t.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <span className="category-label">{t.category}</span>
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <span className="connection">
              <span />
              ลิงก์เท่านั้น · ยังไม่เชื่อมต่อ
            </span>
            <CostInput
              id={t.id}
              name={t.name}
              value={data.costs[t.id]}
              onSave={(amount) =>
                save({ ...data, costs: { ...data.costs, [t.id]: amount } })
              }
            />
            <div className="tool-footer">
              <a
                className="official-link"
                href={t.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.custom ? "เปิดเว็บไซต์ที่ระบุ" : "เว็บไซต์ทางการ"}
                <ArrowUpRight size={14} />
              </a>
              {t.custom && (
                <div className="actions">
                  <button
                    aria-label={"แก้ไขเครื่องมือ " + t.name}
                    onClick={() => {
                      setEditor(t);
                      setFormError("");
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    aria-label={"ลบเครื่องมือ " + t.name}
                    onClick={() => remove(t)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty">
          ไม่พบเครื่องมือตามตัวกรอง ลองเปลี่ยนหมวดหรือประเภทงาน
        </div>
      )}
      <div className="note">
        รายชื่อรวมเครื่องมือ AI และแพลตฟอร์มธุรกิจที่มีฟีเจอร์ AI/automation
        รายการโปรดและงบประมาณไม่ได้สมัครบริการหรือยืนยันแพ็กเกจฟรี
        เว็บไซต์ภายนอกอาจมีค่าใช้จ่ายและเปลี่ยน URL ได้
        เครื่องมือที่เพิ่มเองยังไม่ได้ตรวจสอบเจ้าของเว็บไซต์
      </div>
    </section>
  );
}
function SparkleHeading() {
  return <h3>✦ ค้นหาผู้ช่วยตามงานของคุณ</h3>;
}
function CostInput({
  id,
  name,
  value,
  onSave,
}: {
  id: string;
  name: string;
  value?: number;
  onSave: (n: number) => boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(String(value ?? ""));
  return (
    <div className="cost-input">
      {!editing ? (
        <button
          onClick={() => {
            setAmount(String(value ?? ""));
            setEditing(true);
          }}
          aria-label={"ตั้งงบ " + name}
        >
          {value === undefined
            ? "ยังไม่ระบุงบ / เดือน"
            : money(value) + " / เดือน"}{" "}
          <Pencil size={11} />
        </button>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number(amount);
            if (
              amount.trim() &&
              Number.isFinite(n) &&
              n >= 0 &&
              n <= 10000000 &&
              onSave(Math.round(n * 100) / 100)
            )
              setEditing(false);
          }}
        >
          <label htmlFor={"cost-" + id} className="sr-only">
            {"งบรายเดือน " + name}
          </label>
          <input
            id={"cost-" + id}
            type="number"
            step="0.01"
            min="0"
            max="10000000"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <button type="submit">บันทึก</button>
          <button type="button" onClick={() => setEditing(false)}>
            ยกเลิก
          </button>
        </form>
      )}
    </div>
  );
}
