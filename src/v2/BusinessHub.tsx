import { useState } from "react";
import { Plus, ArrowUpRight } from "lucide-react";
import { departments, type BusinessTask } from "./providers";
export function BusinessHub({
  tasks,
  onChange,
  onAdd,
  onOpen,
}: {
  tasks: BusinessTask[];
  onChange: (tasks: BusinessTask[]) => boolean;
  onAdd: () => void;
  onOpen: (page: "customers" | "finance" | "projects" | "content") => void;
}) {
  const [department, setDepartment] = useState("");
  const [query, setQuery] = useState("");
  const visible = tasks.filter(
    (t) =>
      (!department ||
        (department === "unassigned"
          ? !t.department
          : t.department === department)) &&
      t.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section>
      <div className="module-banner">
        <div>
          <span className="eyebrow">BUSINESS OPERATIONS · V2</span>
          <h2>เห็นทุกฝ่าย ใช้งานชุดเดียวกับ V1</h2>
          <p>
            จัดฝ่ายและติดตามงานเดิม ไม่ย้ายหรือสร้างสำเนาข้อมูลโครงการ งาน และ
            CRM
          </p>
        </div>
        <button className="primary" onClick={onAdd}>
          <Plus size={16} />
          เพิ่มงานธุรกิจ
        </button>
      </div>
      <div className="v2-department-grid">
        {departments.map((d) => (
          <button
            key={d}
            className={
              "panel v2-department " + (department === d ? "selected" : "")
            }
            aria-pressed={department === d}
            onClick={() => setDepartment(department === d ? "" : d)}
          >
            <strong>{d}</strong>
            <span>
              {
                tasks.filter(
                  (t) => t.department === d && t.status !== "เสร็จแล้ว",
                ).length
              }{" "}
              งานค้าง
            </span>
          </button>
        ))}
      </div>
      <div className="v2-quick-links">
        <button onClick={() => onOpen("content")}>
          แผนการตลาด/คอนเทนต์ <ArrowUpRight size={14} />
        </button>
        <button onClick={() => onOpen("customers")}>
          CRM และ Sales Pipeline <ArrowUpRight size={14} />
        </button>
        <button onClick={() => onOpen("finance")}>
          รายรับและรายจ่าย <ArrowUpRight size={14} />
        </button>
        <button onClick={() => onOpen("projects")}>
          โครงการทั้งหมด <ArrowUpRight size={14} />
        </button>
      </div>
      <div className="filter-bar">
        <label>
          ค้นหางานธุรกิจ
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่องานเดิมหรือใหม่"
          />
        </label>
        <label>
          ฝ่ายงาน
          <select
            aria-label="ฝ่ายงาน"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">ทุกฝ่าย</option>
            <option value="unassigned">ยังไม่จัดฝ่าย (งาน V1)</option>
            {departments.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="panel table-wrap v2-business-table">
        <table>
          <thead>
            <tr>
              <th>งาน</th>
              <th>ฝ่าย</th>
              <th>วันครบกำหนด</th>
              <th>ความสำคัญ</th>
              <th>สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => (
              <tr key={t.id}>
                <td>
                  <strong>{t.name}</strong>
                </td>
                <td>
                  <select
                    aria-label={"ฝ่ายของ " + t.name}
                    value={t.department || ""}
                    onChange={(e) =>
                      onChange(
                        tasks.map((x) =>
                          x.id === t.id
                            ? { ...x, department: e.target.value }
                            : x,
                        ),
                      )
                    }
                  >
                    <option value="">ยังไม่จัดฝ่าย</option>
                    {departments.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </td>
                <td>{t.due || "ไม่ระบุ"}</td>
                <td>{t.priority}</td>
                <td>
                  <select
                    aria-label={"สถานะงานธุรกิจ " + t.name}
                    value={t.status}
                    onChange={(e) =>
                      onChange(
                        tasks.map((x) =>
                          x.id === t.id ? { ...x, status: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    {["รอดำเนินการ", "กำลังทำ", "เสร็จแล้ว"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!visible.length && (
          <div className="empty">
            ไม่พบงานในฝ่ายนี้ งาน V1 ที่ยังไม่จัดฝ่ายยังอยู่ในตัวกรอง “ทุกฝ่าย”
          </div>
        )}
      </div>
    </section>
  );
}
