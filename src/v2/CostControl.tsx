import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { type Tool } from "../features/catalog";
import { localDate, money } from "../features/useBusiness";
import { costSources } from "./costSources";
import { type V2Store } from "./useV2";
function daysUntil(date: string) {
  return Math.ceil(
    (new Date(date + "T00:00:00").getTime() -
      new Date(localDate() + "T00:00:00").getTime()) /
      86400000,
  );
}
export function CostControl({
  tools,
  costs,
  store,
}: {
  tools: Tool[];
  costs: Record<string, number>;
  store: V2Store;
}) {
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">COST CONTROL · VERIFY BEFORE SPENDING</span>
          <h2>รู้ข้อจำกัด ก่อนเกิดค่าใช้จ่าย</h2>
          <p>
            อ่านแผนสาธารณะ ไม่สมัคร ไม่ผูกบัตร ไม่เปิด billing
            และไม่อ่านโควตาจากบัญชีจริง
          </p>
        </div>
        <span className="badge neutral">ไม่เปิดใช้ API</span>
      </div>
      <div className="executive-grid">
        <div className="panel executive-stat">
          <small>งบ AI ที่ระบุเองใน Directory</small>
          <strong>
            {money(Object.values(costs).reduce((s, n) => s + n, 0))}
          </strong>
        </div>
        <div className="panel executive-stat">
          <small>แหล่งข้อมูลที่อ่านยืนยันได้</small>
          <strong>
            {costSources.filter((x) => x.reviewedOn).length}/
            {costSources.length}
          </strong>
        </div>
        <div className="panel executive-stat">
          <small>รายการไม่ระบุงบ (ไม่แปลว่าฟรี)</small>
          <strong>
            {tools.filter((t) => costs[t.id] === undefined).length}
          </strong>
        </div>
        <div className="panel executive-stat">
          <small>การสมัคร/เปิด billing โดยระบบ</small>
          <strong>0</strong>
        </div>
      </div>
      <p className="note">
        ข้อมูลผู้ให้บริการเป็น snapshot ตามวันที่ระบุ ไม่ยืนยันสิทธิ์บัญชีของคุณ
        ไม่รับรองว่าใช้ฟรีตลอดไป และไม่ยืนยันว่าแพ็กเกจแชตรวม API
        แหล่งที่ถูกปิดกั้นเครือข่ายแสดง “ยังไม่ยืนยัน” เครื่องมืออื่นใน
        Directory ยังไม่มีข้อมูลแผนที่ตรวจแล้ว
      </p>
      <label className="search">
        <input
          aria-label="ค้นหา Cost Control"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหาชื่อเครื่องมือ"
        />
      </label>
      {message && (
        <p role="status" className="note">
          {message}
        </p>
      )}
      <div className="v2-cost-grid">
        {costSources
          .filter((s) =>
            (tools.find((t) => t.id === s.toolId)?.name || "")
              .toLowerCase()
              .includes(query.toLowerCase()),
          )
          .map((s) => {
            const tool = tools.find((t) => t.id === s.toolId);
            const note = store.data.accounts[s.toolId];
            const usage = note?.usage[store.month];
            const days = note?.trialEnd ? daysUntil(note.trialEnd) : null;
            const stale = !!s.reviewedOn && daysUntil(s.reviewedOn) < -30;
            return (
              <article className="panel v2-cost-card" key={s.toolId}>
                <div className="section-heading">
                  <h3>{tool?.name || s.toolId}</h3>
                  <span
                    className={
                      "badge " + (s.reviewedOn && !stale ? "green" : "neutral")
                    }
                  >
                    {s.reviewedOn
                      ? stale
                        ? "ควรตรวจใหม่"
                        : "อ่านแหล่งข้อมูลแล้ว"
                      : "ยังไม่ยืนยัน"}
                  </span>
                </div>
                <dl>
                  <dt>แผนฟรี</dt>
                  <dd>{s.freePlan}</dd>
                  <dt>โควตา</dt>
                  <dd>{s.quota}</dd>
                  <dt>ข้อจำกัด</dt>
                  <dd>{s.limitations}</dd>
                  <dt>ระยะทดลองจากผู้ให้บริการ</dt>
                  <dd>{s.trial}</dd>
                  <dt>ความเสี่ยงค่าใช้จ่าย</dt>
                  <dd>{s.risk}</dd>
                  <dt>ตรวจเนื้อหาครั้งล่าสุด</dt>
                  <dd>
                    {s.reviewedOn ||
                      "ยังอ่านเนื้อหาไม่ได้ — เครือข่ายปฏิเสธการเข้าถึง"}
                  </dd>
                </dl>
                <a
                  className="official-link"
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ตรวจข้อมูลกับผู้ให้บริการ <ArrowUpRight size={14} />
                </a>
                <form
                  className="v2-account-note"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    const raw = String(f.get("usage")).trim();
                    const n = raw === "" ? undefined : Number(raw);
                    if (n !== undefined && (!Number.isSafeInteger(n) || n < 0))
                      return;
                    const months = { ...note?.usage };
                    if (n === undefined) delete months[store.month];
                    else months[store.month] = n;
                    if (
                      store.save({
                        ...store.data,
                        accounts: {
                          ...store.data.accounts,
                          [s.toolId]: {
                            trialEnd: String(f.get("trialEnd")),
                            usage: months,
                          },
                        },
                      })
                    )
                      setMessage(
                        "บันทึกตัวเลขที่กรอกเองแล้ว ไม่มีการตรวจบัญชีหรือเปลี่ยนแพ็กเกจ",
                      );
                  }}
                >
                  <h4>บันทึกติดตามเอง — ไม่ยืนยันโดยผู้ให้บริการ</h4>
                  <label>
                    การใช้ {tool?.name} เดือน {store.month} ({s.unit})
                    <input
                      aria-label={"การใช้ " + tool?.name}
                      name="usage"
                      type="number"
                      min="0"
                      step="1"
                      max="999999999"
                      defaultValue={usage ?? ""}
                    />
                  </label>
                  <label>
                    วันหมดอายุทดลอง {tool?.name} ที่ตรวจจากบัญชีเอง
                    <input
                      aria-label={"วันทดลอง " + tool?.name}
                      name="trialEnd"
                      type="date"
                      defaultValue={note?.trialEnd || ""}
                    />
                  </label>
                  <button
                    className="secondary"
                    type="submit"
                    disabled={store.locked}
                  >
                    บันทึกการติดตาม {tool?.name}
                  </button>
                </form>
                <div className="v2-risk">
                  <strong>
                    {days === null
                      ? "ไม่ทราบวันหมดอายุทดลอง"
                      : days < 0
                        ? "วันทดลองที่ระบุผ่านไปแล้ว"
                        : days <= 7
                          ? "วันทดลองที่ระบุใกล้สิ้นสุด"
                          : "เหลือ " + days + " วันตามวันที่กรอกเอง"}
                  </strong>
                  <p>
                    {s.monthlyLimit !== null && usage !== undefined
                      ? stale
                        ? "ข้อมูลโควตาเก่า ควรยืนยันใหม่ก่อนเปรียบเทียบ"
                        : usage >= s.monthlyLimit
                          ? "ตัวเลขที่กรอกถึง/เกินโควตา inline suggestions ที่ตรวจไว้"
                          : usage >= s.monthlyLimit * 0.8
                            ? "ตัวเลขที่กรอกใกล้โควตาที่ตรวจไว้"
                            : "ตัวเลขที่กรอกยังต่ำกว่าโควตาที่ตรวจไว้"
                      : "ยังยืนยันโควตาคงเหลือไม่ได้"}
                  </p>
                  <small>
                    ครบกำหนดหรือเกินโควตาไม่ทำให้ระบบอัปเกรดอัตโนมัติ
                  </small>
                </div>
              </article>
            );
          })}
      </div>
    </section>
  );
}
