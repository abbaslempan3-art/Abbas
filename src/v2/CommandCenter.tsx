import { useState } from "react";
import { ArrowUpRight, Copy, Save, Trash2 } from "lucide-react";
import { type Tool } from "../features/catalog";
import {
  departments,
  commandProviderIds,
  integrationState,
  statusLabels,
} from "./providers";
import { type CommandDraft, type V2Store } from "./useV2";
export function CommandCenter({
  tools,
  store,
}: {
  tools: Tool[];
  store: V2Store;
}) {
  const [draft, setDraft] = useState<CommandDraft>({
    id: crypto.randomUUID(),
    title: "",
    prompt: "",
    toolId: "tool-chatgpt",
    department: departments[0],
    createdAt: new Date().toISOString(),
  });
  const [notice, setNotice] = useState("");
  const tool = tools.find((t) => t.id === draft.toolId);
  const available = tools.filter((t) => commandProviderIds.includes(t.id));
  const update = (next: CommandDraft) => {
    setDraft(next);
    setNotice("");
  };
  async function copy() {
    try {
      await navigator.clipboard.writeText(draft.prompt);
      setNotice(
        "คัดลอกแล้ว ยังไม่ได้ส่งให้ AI เปิดเว็บไซต์และวางข้อความด้วยตนเอง",
      );
    } catch {
      setNotice(
        "คัดลอกอัตโนมัติไม่ได้ เลือกและคัดลอกข้อความจากช่องคำสั่งได้ ข้อมูลยังไม่ถูกส่ง",
      );
    }
  }
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">ABBAS V2 · COMMAND DESK</span>
          <h2>เตรียมคำสั่งให้ชัดเจน ก่อนลงมือกับ AI</h2>
          <p>พื้นที่ร่างงานกลาง ไม่มีการส่งข้อความหรือสั่ง AI อัตโนมัติ</p>
        </div>
        <span className="badge neutral">เชื่อมต่อจริง 0 รายการ</span>
      </div>
      <div className="v2-provider-grid">
        {available.map((t) => (
          <button
            className={
              "panel v2-provider " + (draft.toolId === t.id ? "selected" : "")
            }
            key={t.id}
            aria-pressed={draft.toolId === t.id}
            onClick={() => update({ ...draft, toolId: t.id })}
          >
            <strong>{t.name}</strong>
            <span className="badge green">
              {statusLabels[integrationState(t)]}
            </span>
            <small>สั่งงานผ่าน API: ยังไม่พร้อมใช้งาน</small>
          </button>
        ))}
      </div>
      <div className="workflow-layout">
        <form
          className="panel inline-editor"
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.title.trim() || !draft.prompt.trim()) return;
            const item = {
              ...draft,
              title: draft.title.trim(),
              prompt: draft.prompt.trim(),
            };
            if (
              store.save({
                ...store.data,
                drafts: store.data.drafts.some((d) => d.id === draft.id)
                  ? store.data.drafts.map((d) => (d.id === draft.id ? item : d))
                  : [item, ...store.data.drafts],
              })
            )
              setNotice("บันทึกร่างในเครื่องแล้ว ยังไม่ได้ส่งคำสั่งให้ AI");
          }}
        >
          <h3>ร่างคำสั่งธุรกิจ</h3>
          <label>
            ชื่องานคำสั่ง
            <input
              required
              maxLength={150}
              value={draft.title}
              onChange={(e) => update({ ...draft, title: e.target.value })}
            />
          </label>
          <div className="form-grid">
            <label>
              ฝ่ายธุรกิจคำสั่ง
              <select
                aria-label="ฝ่ายธุรกิจคำสั่ง"
                value={draft.department}
                onChange={(e) =>
                  update({ ...draft, department: e.target.value })
                }
              >
                {departments.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label>
              AI ที่วางแผนใช้
              <select
                aria-label="AI ที่วางแผนใช้"
                value={draft.toolId}
                onChange={(e) => update({ ...draft, toolId: e.target.value })}
              >
                {tools.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            ข้อความคำสั่ง
            <textarea
              aria-label="ข้อความคำสั่ง"
              required
              maxLength={8000}
              rows={8}
              placeholder="เช่น วางแผนการตลาด 7 วันสำหรับร้านอาหารสมมติ ระบุขั้นตอน งบประมาณ และตัวชี้วัด"
              value={draft.prompt}
              onChange={(e) => update({ ...draft, prompt: e.target.value })}
            />
          </label>
          <p className="muted">
            ใช้ข้อมูลสมมติเท่านั้น ห้ามใส่ข้อมูลลูกค้าจริง รหัสผ่าน API key
            หรือข้อมูลการเงินจริง
          </p>
          <div className="form-actions">
            <button
              className="secondary"
              type="button"
              disabled={!draft.prompt.trim()}
              onClick={copy}
            >
              <Copy size={14} />
              คัดลอกคำสั่ง
            </button>
            <button className="primary" type="submit" disabled={store.locked}>
              <Save size={14} />
              บันทึกร่าง
            </button>
          </div>
          <div className="v2-execution">
            <span className="badge neutral">
              API: {statusLabels[integrationState(tool, "execute")]}
            </span>
            <button type="button" className="secondary" disabled>
              ส่งคำสั่ง AI (ยังไม่เปิดใช้)
            </button>
            {tool && (
              <a
                className="official-link"
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                เปิด {tool.name} ด้วยตนเอง <ArrowUpRight size={14} />
              </a>
            )}
          </div>
          <p role="status" className="note">
            {notice ||
              "การเปิดเว็บไซต์ไม่ส่งคำสั่ง ประวัติ หรือข้อมูลธุรกิจไปด้วย"}
          </p>
        </form>
        <div className="panel saved-workflows">
          <div className="section-heading">
            <h3>ร่างที่บันทึก ({store.data.drafts.length})</h3>
            <button
              className="text-button"
              onClick={() =>
                update({
                  id: crypto.randomUUID(),
                  title: "",
                  prompt: "",
                  toolId: "tool-chatgpt",
                  department: departments[0],
                  createdAt: new Date().toISOString(),
                })
              }
            >
              ร่างใหม่
            </button>
          </div>
          {store.data.drafts.map((d) => (
            <article className="saved-workflow" key={d.id}>
              <button
                aria-label={"เปิดร่าง " + d.title}
                onClick={() => update(d)}
              >
                <strong>{d.title}</strong>
                <small>
                  {tools.find((t) => t.id === d.toolId)?.name ||
                    "ไม่พบเครื่องมือเดิม"}{" "}
                  · {d.department}
                </small>
                <small>ร่างเท่านั้น · ยังไม่ได้ส่ง</small>
              </button>
              <button
                aria-label={"ลบร่าง " + d.title}
                disabled={store.locked}
                onClick={() => {
                  if (confirm("ลบเฉพาะร่างคำสั่งนี้?"))
                    store.save({
                      ...store.data,
                      drafts: store.data.drafts.filter((x) => x.id !== d.id),
                    });
                }}
              >
                <Trash2 size={15} />
              </button>
            </article>
          ))}
          {!store.data.drafts.length && (
            <p className="muted">
              ยังไม่มีร่างคำสั่ง เริ่มจากแผนงานเล็ก ๆ ที่ตรวจทานได้
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
