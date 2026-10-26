import { Workspace } from "./v3/Workspace";
import { BackupPanel } from "./v3/BackupPanel";
import { useWorkspace } from "./v3/useWorkspace";
import { CommandCenter } from "./v2/CommandCenter";
import { BusinessHub } from "./v2/BusinessHub";
import { CostControl } from "./v2/CostControl";
import { departments } from "./v2/providers";
import { useV2 } from "./v2/useV2";
import { ToolDirectory } from "./features/Directory";
import {
  Executive,
  Finance,
  ContentPlanner,
  Workflows,
  IntegrationSettings,
} from "./features/Business";
import { useBusiness } from "./features/useBusiness";
import { businesses } from "./features/catalog";
import { useEffect, useRef, useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  ListTodo,
  Users,
  Sparkles,
  ChartNoAxesCombined,
  Plus,
  ArrowUpRight,
  Search,
  X,
  Menu,
  Check,
  Clock,
  ArrowRight,
  Pencil,
  Trash2,
  Wallet,
  CalendarDays,
  Workflow,
  Settings,
  Terminal,
  BriefcaseBusiness,
  ShieldCheck,
  PanelsTopLeft,
  DatabaseBackup,
} from "lucide-react";

type Project = {
  id: string;
  name: string;
  description: string;
  business?: string;
  status: string;
};
type Task = {
  department?: string;
  id: string;
  name: string;
  project: string;
  due: string;
  priority: string;
  status: string;
};
type Customer = { id: string; name: string; company: string; status: string };
type Data = { projects: Project[]; tasks: Task[]; customers: Customer[] };
type Page =
  | "workspace-v3"
  | "backup"
  | "command"
  | "operations"
  | "cost-control"
  | "overview"
  | "projects"
  | "tasks"
  | "customers"
  | "tools"
  | "reports"
  | "finance"
  | "content"
  | "workflows"
  | "settings";
const key = "abbas-command-center-v1";
const today = () => new Date().toLocaleDateString("en-CA");
const seed: Data = {
  projects: [
    {
      id: "p1",
      name: "AI Content Studio",
      description: "สร้างคอนเทนต์ให้แบรนด์ด้วยพลัง AI",
      status: "กำลังดำเนินการ",
    },
    {
      id: "p2",
      name: "ระบบดูแลลูกค้าอัตโนมัติ",
      description: "ออกแบบประสบการณ์ที่ดีให้ลูกค้าทุกคน",
      status: "กำลังดำเนินการ",
    },
    {
      id: "p3",
      name: "เว็บไซต์ธุรกิจ V1",
      description: "พื้นที่ออนไลน์สำหรับธุรกิจยุคใหม่",
      status: "วางแผน",
    },
    {
      id: "p4",
      name: "แผนการตลาดรายเดือน",
      description: "วางกลยุทธ์และวัดผลการเติบโต",
      status: "เสร็จแล้ว",
    },
  ],
  tasks: [
    {
      id: "t1",
      name: "วางแผนคอนเทนต์สำหรับเดือนถัดไป",
      project: "p1",
      due: today(),
      priority: "สูง",
      status: "กำลังทำ",
    },
    {
      id: "t2",
      name: "ออกแบบขั้นตอนการตอบกลับลูกค้า",
      project: "p2",
      due: today(),
      priority: "สูง",
      status: "รอดำเนินการ",
    },
    {
      id: "t3",
      name: "จัดเตรียมเนื้อหาหน้าเว็บไซต์",
      project: "p3",
      due: "",
      priority: "ปานกลาง",
      status: "รอดำเนินการ",
    },
    {
      id: "t4",
      name: "สรุปผลแคมเปญที่ผ่านมา",
      project: "p4",
      due: "",
      priority: "ปานกลาง",
      status: "เสร็จแล้ว",
    },
    {
      id: "t5",
      name: "ทดลองรูปแบบภาพสำหรับโซเชียล",
      project: "p1",
      due: "",
      priority: "ต่ำ",
      status: "กำลังทำ",
    },
  ],
  customers: [
    {
      id: "c1",
      name: "ลูกค้าทดลอง A",
      company: "ธุรกิจตัวอย่าง A",
      status: "กำลังเจรจา",
    },
    {
      id: "c2",
      name: "ลูกค้าทดลอง B",
      company: "ธุรกิจตัวอย่าง B",
      status: "ลูกค้าใหม่",
    },
    {
      id: "c3",
      name: "ลูกค้าทดลอง C",
      company: "ธุรกิจตัวอย่าง C",
      status: "ปิดการขาย",
    },
  ],
};
function validData(value: unknown): value is Data {
  if (!value || typeof value !== "object") return false;
  const d = value as Data;
  return (
    ["projects", "tasks", "customers"].every((k) =>
      Array.isArray(d[k as keyof Data]),
    ) &&
    d.projects.every(
      (p) =>
        p &&
        (p.business === undefined || typeof p.business === "string") &&
        ["id", "name", "description", "status"].every(
          (k) => typeof p[k as keyof Project] === "string",
        ),
    ) &&
    d.tasks.every(
      (t) =>
        t &&
        (t.department === undefined || typeof t.department === "string") &&
        ["id", "name", "project", "due", "priority", "status"].every(
          (k) => typeof t[k as keyof Task] === "string",
        ),
    ) &&
    d.customers.every(
      (c) =>
        c &&
        ["id", "name", "company", "status"].every(
          (k) => typeof c[k as keyof Customer] === "string",
        ),
    )
  );
}
function load(): { data: Data; error: string } {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return { data: seed, error: "" };
    const data: unknown = JSON.parse(raw);
    if (!validData(data)) throw Error();
    return { data, error: "" };
  } catch {
    return {
      data: seed,
      error:
        "ไม่สามารถอ่านข้อมูลเดิมได้ แสดงข้อมูลทดลองแทน โดยยังไม่เขียนทับข้อมูลเดิม",
    };
  }
}
const nav = [
  { id: "workspace-v3", label: "พื้นที่ทำงาน V3", icon: PanelsTopLeft },
  { id: "backup", label: "สำรองและกู้คืน", icon: DatabaseBackup },
  { id: "command", label: "AI Command Center", icon: Terminal },
  { id: "operations", label: "งานธุรกิจ", icon: BriefcaseBusiness },
  { id: "cost-control", label: "Cost Control", icon: ShieldCheck },
  { id: "overview", label: "ภาพรวม", icon: LayoutDashboard },
  { id: "projects", label: "โครงการ", icon: FolderKanban },
  { id: "tasks", label: "งานทั้งหมด", icon: ListTodo },
  { id: "customers", label: "ลูกค้า CRM", icon: Users },
  { id: "tools", label: "เครื่องมือ AI", icon: Sparkles },
  { id: "finance", label: "รายรับและต้นทุน", icon: Wallet },
  { id: "content", label: "แผนคอนเทนต์", icon: CalendarDays },
  { id: "workflows", label: "Workflow จำลอง", icon: Workflow },
  { id: "reports", label: "รายงาน", icon: ChartNoAxesCombined },
  { id: "settings", label: "การเชื่อมต่อและตั้งค่า", icon: Settings },
] as const;
const projectStates = ["วางแผน", "กำลังดำเนินการ", "เสร็จแล้ว"];
const taskStates = ["รอดำเนินการ", "กำลังทำ", "เสร็จแล้ว"];
const customerStates = ["ลูกค้าใหม่", "กำลังเจรจา", "ปิดการขาย", "ไม่สำเร็จ"];
function Badge({ value }: { value: string }) {
  return (
    <span
      className={
        "badge " +
        (value === "เสร็จแล้ว" || value === "ปิดการขาย"
          ? "green"
          : value === "สูง"
            ? "red"
            : value === "กำลังทำ" ||
                value === "กำลังดำเนินการ" ||
                value === "กำลังเจรจา"
              ? "blue"
              : "neutral")
      }
    >
      {value}
    </span>
  );
}
export default function App({
  recoveryNotice = "",
}: {
  recoveryNotice?: string;
}) {
  const workspaceStore = useWorkspace();
  const businessStore = useBusiness();
  const v2Store = useV2();
  const [initial] = useState(load);
  const [data, setData] = useState(initial.data);
  const [error, setError] = useState(initial.error);
  const [page, setPage] = useState<Page>("overview");
  const [query, setQuery] = useState("");
  const [mobile, setMobile] = useState(false);
  const [modal, setModal] = useState<{
    kind: "projects" | "tasks" | "customers";
    id?: string;
  } | null>(null);
  const save = (next: Data) => {
    try {
      localStorage.setItem(key, JSON.stringify(next));
      setData(next);
      setError("");
      return true;
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาตรวจสอบสิทธิ์หรือพื้นที่ Local Storage");
      return false;
    }
  };
  const go = (p: Page) => {
    setPage(p);
    setQuery("");
    setMobile(false);
    window.scrollTo(0, 0);
  };
  const done = data.tasks.filter((t) => t.status === "เสร็จแล้ว").length;
  const pending = data.tasks.length - done;
  const urgent = data.tasks.filter(
    (t) =>
      t.status !== "เสร็จแล้ว" &&
      (t.priority === "สูง" || (t.due && t.due < today())),
  );
  const percent = data.tasks.length
    ? Math.round((done / data.tasks.length) * 100)
    : 0;
  const progress = (id: string) => {
    const ts = data.tasks.filter((t) => t.project === id);
    return ts.length
      ? Math.round(
          (ts.filter((t) => t.status === "เสร็จแล้ว").length / ts.length) * 100,
        )
      : 0;
  };
  const remove = (kind: "projects" | "tasks" | "customers", id: string) => {
    if (
      !confirm(
        "ยืนยันการลบรายการนี้?" +
          (kind === "projects"
            ? " งานที่เกี่ยวข้องจะถูกเก็บไว้โดยไม่มีโครงการ"
            : ""),
      )
    )
      return;
    save({
      ...data,
      [kind]: data[kind].filter((x) => x.id !== id),
      ...(kind === "projects"
        ? {
            tasks: data.tasks.map((t) =>
              t.project === id ? { ...t, project: "" } : t,
            ),
          }
        : {}),
    });
  };
  function taskTable(tasks: Task[]) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ชื่องาน / โครงการ</th>
              <th>วันครบกำหนด</th>
              <th>ความสำคัญ</th>
              <th>สถานะ</th>
              <th>
                <span className="sr-only">จัดการ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id}>
                <td>
                  <div className="task-name">
                    <button
                      className={
                        "checkbox " +
                        (t.status === "เสร็จแล้ว" ? "checked" : "")
                      }
                      aria-label={"เปลี่ยนสถานะ " + t.name}
                      onClick={() =>
                        save({
                          ...data,
                          tasks: data.tasks.map((x) =>
                            x.id === t.id
                              ? {
                                  ...x,
                                  status:
                                    x.status === "เสร็จแล้ว"
                                      ? "รอดำเนินการ"
                                      : "เสร็จแล้ว",
                                }
                              : x,
                          ),
                        })
                      }
                    >
                      {t.status === "เสร็จแล้ว" && <Check size={12} />}
                    </button>
                    <div>
                      <strong>{t.name}</strong>
                      <small>
                        {data.projects.find((p) => p.id === t.project)?.name ||
                          "ไม่มีโครงการ"}
                      </small>
                    </div>
                  </div>
                </td>
                <td
                  className={
                    t.due && t.due < today() && t.status !== "เสร็จแล้ว"
                      ? "overdue"
                      : ""
                  }
                >
                  {t.due
                    ? new Date(t.due + "T00:00:00").toLocaleDateString(
                        "th-TH",
                        { day: "numeric", month: "short", year: "2-digit" },
                      )
                    : "ไม่ระบุ"}
                </td>
                <td>
                  <Badge value={t.priority} />
                </td>
                <td>
                  <Badge value={t.status} />
                </td>
                <td>
                  <div className="actions">
                    <button
                      aria-label={"แก้ไข " + t.name}
                      onClick={() => setModal({ kind: "tasks", id: t.id })}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      aria-label={"ลบ " + t.name}
                      onClick={() => remove("tasks", t.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!tasks.length && <div className="empty">ยังไม่มีงานในรายการนี้</div>}
      </div>
    );
  }
  const matching = (text: string) =>
    text.toLowerCase().includes(query.toLowerCase());
  return (
    <div className="app">
      <aside className={mobile ? "sidebar open" : "sidebar"}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("overview");
          }}
        >
          <div className="brand-mark">
            a<span>✦</span>
          </div>
          <div>
            ABBAS<span>AI COMMAND CENTER</span>
          </div>
        </a>
        <div className="workspace">
          <span className="workspace-icon">A</span>
          <div>
            พื้นที่ทำงานของ Abbas<small>Personal workspace</small>
          </div>
          <span className="version">V3</span>
        </div>
        <div className="nav-label">พื้นที่ทำงาน</div>
        <nav id="workspace-navigation">
          {nav.map((n) => (
            <button
              key={n.id}
              className={page === n.id ? "active" : ""}
              onClick={() => go(n.id)}
            >
              <n.icon size={19} />
              {n.label}
              {n.id === "tasks" && <span className="nav-count">{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-card">
            <span className="status-dot" /> ข้อมูลอยู่กับคุณ
            <small>จัดเก็บบนเบราว์เซอร์นี้ด้วย Local Storage</small>
          </div>
          <div className="profile">
            <div className="avatar">AB</div>
            <div>
              Abbas Workspace<small>โหมดทดลอง · ไม่มีการเชื่อมต่อ API</small>
            </div>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          className="scrim"
          aria-label="ปิดเมนู"
          onClick={() => setMobile(false)}
        />
      )}
      <div className="main">
        <header>
          <div className="breadcrumb">
            <button
              className="mobile-toggle"
              onClick={() => setMobile(!mobile)}
              aria-label="เปิดเมนู"
              aria-expanded={mobile}
              aria-controls="workspace-navigation"
            >
              <Menu size={21} />
            </button>
            <span>พื้นที่ทำงาน</span>
            <span>/</span>
            <strong>{nav.find((n) => n.id === page)?.label}</strong>
          </div>
          <div className="header-right">
            <span className="demo-pill">
              <span className="status-dot" />
              เวอร์ชันทดลอง
            </span>
            <div className="avatar small">AB</div>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">YOUR BUSINESS, IN FOCUS</div>
              <h1>
                {page === "overview"
                  ? "ภาพรวมธุรกิจของคุณ"
                  : nav.find((n) => n.id === page)?.label}
                <span className="heading-dot">.</span>
              </h1>
              <p>
                {page === "overview"
                  ? "เริ่มต้นวันด้วยภาพที่ชัดเจน แล้วเปลี่ยนทุกแผนให้เป็นความสำเร็จ"
                  : "จัดการทุกความคืบหน้า ในพื้นที่เดียว"}
              </p>
            </div>
            {["overview", "projects", "tasks", "customers", "reports"].includes(
              page,
            ) && (
              <button
                className="primary"
                onClick={() =>
                  setModal({
                    kind:
                      page === "customers"
                        ? "customers"
                        : page === "tasks"
                          ? "tasks"
                          : "projects",
                  })
                }
              >
                <Plus size={18} />
                {page === "customers"
                  ? "เพิ่มลูกค้า"
                  : page === "tasks"
                    ? "เพิ่มงาน"
                    : "สร้างโครงการ"}
              </button>
            )}
          </div>
          {error && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {businessStore.error && (
            <div role="alert" className="error">
              {businessStore.error}
            </div>
          )}
          {recoveryNotice && (
            <p className="note" role="status">
              {recoveryNotice}
            </p>
          )}
          {workspaceStore.error && (
            <p className="error" role="alert">
              {workspaceStore.error}
            </p>
          )}
          {page === "workspace-v3" && (
            <Workspace
              tasks={data.tasks}
              customers={data.customers}
              business={businessStore}
              v2={v2Store}
              workspace={workspaceStore}
              onAddTask={() => setModal({ kind: "tasks" })}
              onOpen={go}
              onCustomers={(customers) => save({ ...data, customers })}
            />
          )}
          {page === "backup" && <BackupPanel />}
          {v2Store.error && (
            <div className="error" role="alert">
              {v2Store.error}
            </div>
          )}
          {page === "command" && (
            <CommandCenter tools={businessStore.tools} store={v2Store} />
          )}
          {page === "operations" && (
            <BusinessHub
              tasks={data.tasks}
              onChange={(tasks) => save({ ...data, tasks })}
              onAdd={() => setModal({ kind: "tasks" })}
              onOpen={go}
            />
          )}
          {page === "cost-control" && (
            <CostControl
              tools={businessStore.tools}
              costs={businessStore.data.costs}
              store={v2Store}
            />
          )}
          {page === "overview" && <Executive store={businessStore} />}
          {page === "overview" && (
            <>
              <div className="welcome">
                <div>
                  <span className="welcome-tag">
                    <Sparkles size={14} /> ABBAS AI COMMAND CENTER
                  </span>
                  <h2>ทุกไอเดีย พร้อมเติบโตไปด้วยกัน</h2>
                  <p>จัดการโครงการ ดูแลงาน และขับเคลื่อนธุรกิจด้วย AI</p>
                  <button onClick={() => go("projects")}>
                    สำรวจโครงการของคุณ <ArrowRight size={16} />
                  </button>
                </div>
                <div className="orbit-art" aria-hidden="true">
                  <div className="orbit o1" />
                  <div className="orbit o2" />
                  <div className="orbit o3" />
                  <div className="orbit-core">
                    <Sparkles size={36} />
                  </div>
                  <span className="orb orb1">✦</span>
                  <span className="orb orb2">↗</span>
                  <span className="orb orb3">+</span>
                </div>
              </div>
              <div className="stats">
                {[
                  {
                    label: "โครงการทั้งหมด",
                    value: data.projects.length,
                    foot: "ทุกไอเดียที่กำลังขับเคลื่อน",
                    icon: FolderKanban,
                    color: "mint",
                  },
                  {
                    label: "งานที่ต้องทำ",
                    value: pending,
                    foot: "พร้อมเดินหน้าต่อไป",
                    icon: Clock,
                    color: "orange",
                  },
                  {
                    label: "งานเสร็จสมบูรณ์",
                    value: done,
                    foot: `คิดเป็น ${percent}% ของงานทั้งหมด`,
                    icon: Check,
                    color: "purple",
                  },
                  {
                    label: "งานเร่งด่วน",
                    value: urgent.length,
                    foot: "งานสำคัญสูงหรืองานเลยกำหนด",
                    icon: ArrowUpRight,
                    color: "rose",
                  },
                ].map((s) => (
                  <div className="stat" key={s.label}>
                    <div className="stat-top">
                      {s.label}
                      <span className={"stat-icon " + s.color}>
                        <s.icon size={19} />
                      </span>
                    </div>
                    <strong>{s.value.toString().padStart(2, "0")}</strong>
                    <small>{s.foot}</small>
                  </div>
                ))}
              </div>
            </>
          )}
          {(page === "overview" || page === "projects") && (
            <section>
              <div className="section-heading">
                <div>
                  <h2>
                    โครงการ
                    {page === "overview" ? "ที่กำลังเดินหน้า" : "ทั้งหมด"}{" "}
                    <span className="count">{data.projects.length}</span>
                  </h2>
                  <p>เปลี่ยนเป้าหมายให้เป็นความคืบหน้าทีละขั้น</p>
                </div>
                {page === "overview" ? (
                  <button
                    className="text-button"
                    onClick={() => go("projects")}
                  >
                    ดูทั้งหมด <ArrowUpRight size={16} />
                  </button>
                ) : (
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label="ค้นหาโครงการ"
                      placeholder="ค้นหาโครงการ…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                )}
              </div>
              <div className="project-grid">
                {data.projects
                  .filter((p) => matching(p.name))
                  .slice(0, page === "overview" ? 3 : undefined)
                  .map((p, i) => (
                    <article className="project-card" key={p.id}>
                      <div className="project-top">
                        <span className={"project-icon color" + (i % 3)}>
                          <FolderKanban size={22} />
                        </span>
                        <Badge value={p.status} />
                      </div>
                      <h3>{p.name}</h3>
                      {p.business && (
                        <small className="project-business">{p.business}</small>
                      )}
                      <p>{p.description || "ยังไม่มีรายละเอียดโครงการ"}</p>
                      <div className="progress-label">
                        <span>ความคืบหน้าของงาน</span>
                        <strong>{progress(p.id)}%</strong>
                      </div>
                      <div className="progress">
                        <div style={{ width: progress(p.id) + "%" }} />
                      </div>
                      <div className="project-footer">
                        <span>
                          <ListTodo size={14} />
                          {
                            data.tasks.filter((t) => t.project === p.id).length
                          }{" "}
                          งาน
                        </span>
                        <div className="actions">
                          <button
                            aria-label={"แก้ไข " + p.name}
                            onClick={() =>
                              setModal({ kind: "projects", id: p.id })
                            }
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            aria-label={"ลบ " + p.name}
                            onClick={() => remove("projects", p.id)}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
              </div>
              {!data.projects.filter((p) => matching(p.name)).length && (
                <div className="empty">
                  ไม่พบโครงการ เริ่มสร้างโครงการแรกของคุณได้เลย
                </div>
              )}
            </section>
          )}
          {(page === "overview" || page === "tasks") && (
            <section className="task-section">
              <div className="section-heading">
                <div>
                  <h2>
                    {page === "overview" ? "งานที่ควรโฟกัส" : "งานทั้งหมด"}{" "}
                    <span className="count">
                      {page === "overview" ? urgent.length : data.tasks.length}
                    </span>
                  </h2>
                  <p>
                    {page === "overview"
                      ? "เรื่องสำคัญที่รอคุณจัดการ"
                      : "วางแผน จัดลำดับ และติดตามงานของคุณ"}
                  </p>
                </div>
                {page === "overview" ? (
                  <button className="text-button" onClick={() => go("tasks")}>
                    ดูงานทั้งหมด <ArrowUpRight size={16} />
                  </button>
                ) : (
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label="ค้นหางาน"
                      placeholder="ค้นหางาน…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                )}
              </div>
              <div className="panel">
                {taskTable(
                  (page === "overview" ? urgent : data.tasks).filter((t) =>
                    matching(t.name),
                  ),
                )}
              </div>
            </section>
          )}
          {page === "customers" && (
            <section>
              <div className="section-heading">
                <div>
                  <h2>Sales Pipeline</h2>
                  <p>จำนวนลูกค้าตัวอย่างในแต่ละขั้น ไม่ใช่มูลค่ารายได้</p>
                </div>
              </div>
              <div className="pipeline-grid">
                {customerStates.map((stage) => (
                  <div className="panel pipeline-column" key={stage}>
                    <h3>
                      {stage}{" "}
                      <span className="count">
                        {
                          data.customers.filter((c) => c.status === stage)
                            .length
                        }
                      </span>
                    </h3>
                    {data.customers
                      .filter((c) => c.status === stage)
                      .map((c) => (
                        <article key={c.id}>
                          <strong>{c.name}</strong>
                          <small>{c.company}</small>
                          <label
                            className="sr-only"
                            htmlFor={"pipeline-" + c.id}
                          >
                            สถานะการขาย {c.name}
                          </label>
                          <select
                            id={"pipeline-" + c.id}
                            value={c.status}
                            onChange={(e) =>
                              save({
                                ...data,
                                customers: data.customers.map((x) =>
                                  x.id === c.id
                                    ? { ...x, status: e.target.value }
                                    : x,
                                ),
                              })
                            }
                          >
                            {customerStates.map((s) => (
                              <option key={s}>{s}</option>
                            ))}
                          </select>
                        </article>
                      ))}
                  </div>
                ))}
              </div>
            </section>
          )}
          {page === "customers" && (
            <section>
              <div className="section-heading">
                <h2>
                  รายชื่อลูกค้า{" "}
                  <span className="count">{data.customers.length}</span>
                </h2>
                <label className="search">
                  <Search size={16} />
                  <input
                    aria-label="ค้นหาลูกค้า"
                    placeholder="ค้นหาชื่อหรือธุรกิจ…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              <div className="panel table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>ลูกค้า</th>
                      <th>ธุรกิจ / องค์กร</th>
                      <th>สถานะการขาย</th>
                      <th>จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.customers
                      .filter((c) => matching(c.name + " " + c.company))
                      .map((c) => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.name}</strong>
                          </td>
                          <td>{c.company || "ไม่ระบุ"}</td>
                          <td>
                            <Badge value={c.status} />
                          </td>
                          <td>
                            <div className="actions">
                              <button
                                aria-label={"แก้ไข " + c.name}
                                onClick={() =>
                                  setModal({ kind: "customers", id: c.id })
                                }
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                aria-label={"ลบ " + c.name}
                                onClick={() => remove("customers", c.id)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {!data.customers.filter((c) =>
                  matching(c.name + " " + c.company),
                ).length && <div className="empty">ไม่พบลูกค้า</div>}
              </div>
            </section>
          )}
          {page === "tools" && <ToolDirectory store={businessStore} />}
          {page === "finance" && <Finance store={businessStore} />}
          {page === "content" && <ContentPlanner store={businessStore} />}
          {page === "workflows" && <Workflows store={businessStore} />}
          {page === "settings" && <IntegrationSettings store={businessStore} />}
          {page === "reports" && (
            <>
              <div className="report-summary panel">
                <div>
                  <span className="eyebrow">WORK PROGRESS</span>
                  <h2>ภาพรวมความสำเร็จ</h2>
                  <p>
                    สำเร็จแล้ว {done} จาก {data.tasks.length} งาน
                  </p>
                </div>
                <div
                  className="ring"
                  style={{
                    background: `conic-gradient(#157f69 ${percent}%, #edf1ee 0)`,
                  }}
                >
                  <span>{percent}%</span>
                </div>
              </div>
              <div className="report-grid">
                <section className="panel report-card">
                  <h2>สถานะงาน</h2>
                  {taskStates.map((s) => (
                    <div className="report-row" key={s}>
                      <Badge value={s} />
                      <strong>
                        {data.tasks.filter((t) => t.status === s).length} งาน
                      </strong>
                    </div>
                  ))}
                </section>
                <section className="panel report-card">
                  <h2>สถานะโครงการ</h2>
                  {projectStates.map((s) => (
                    <div className="report-row" key={s}>
                      <Badge value={s} />
                      <strong>
                        {data.projects.filter((p) => p.status === s).length}{" "}
                        โครงการ
                      </strong>
                    </div>
                  ))}
                </section>
              </div>
              <section className="panel report-card">
                <h2>ความคืบหน้ารายโครงการ</h2>
                {data.projects.map((p) => (
                  <div className="report-project" key={p.id}>
                    <div className="progress-label">
                      <strong>{p.name}</strong>
                      <span>{progress(p.id)}%</span>
                    </div>
                    <div className="progress">
                      <div style={{ width: progress(p.id) + "%" }} />
                    </div>
                  </div>
                ))}
                {!data.projects.length && <p>ยังไม่มีโครงการ</p>}
                <p className="muted">
                  คำนวณจากสัดส่วนงานที่เสร็จ สถานะโครงการปรับได้แยกต่างหาก
                  โครงการที่ไม่มีงานแสดง 0%
                </p>
              </section>
            </>
          )}
          <footer>
            <span>
              ABBAS <b>AI COMMAND CENTER</b>
            </span>
            <span>พื้นที่เล็ก ๆ สำหรับความสำเร็จที่ยิ่งใหญ่ · V3</span>
          </footer>
        </main>
      </div>
      {modal && (
        <Editor
          modal={modal}
          data={data}
          close={() => setModal(null)}
          submit={save}
        />
      )}
    </div>
  );
}
function Editor({
  modal,
  data,
  close,
  submit,
}: {
  modal: { kind: "projects" | "tasks" | "customers"; id?: string };
  data: Data;
  close: () => void;
  submit: (d: Data) => boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus();
  }, []);
  const item = data[modal.kind].find((x) => x.id === modal.id);
  const [business, setBusiness] = useState((item as Project)?.business || "");
  const [name, setName] = useState(item?.name || "");
  const [description, setDescription] = useState(
    (item as Project)?.description || "",
  );
  const [company, setCompany] = useState((item as Customer)?.company || "");
  const [department, setDepartment] = useState(
    (item as Task)?.department || "",
  );
  const [project, setProject] = useState((item as Task)?.project || "");
  const [due, setDue] = useState((item as Task)?.due || "");
  const [priority, setPriority] = useState(
    (item as Task)?.priority || "ปานกลาง",
  );
  const [status, setStatus] = useState(
    item?.status ||
      (modal.kind === "projects"
        ? projectStates[0]
        : modal.kind === "tasks"
          ? taskStates[0]
          : customerStates[0]),
  );
  const states =
    modal.kind === "projects"
      ? projectStates
      : modal.kind === "tasks"
        ? taskStates
        : customerStates;
  return (
    <div
      className="modal-backdrop"
      onKeyDown={(e) => {
        if (e.key === "Escape") close();
        if (e.key === "Tab") {
          const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
            "button, input, textarea, select",
          );
          if (nodes?.length) {
            const first = nodes[0],
              last = nodes[nodes.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        <div className="modal-heading">
          <h2 id="editor-title">
            {modal.id ? "แก้ไข" : "เพิ่ม"}
            {modal.kind === "projects"
              ? "โครงการ"
              : modal.kind === "tasks"
                ? "งาน"
                : "ลูกค้า"}
          </h2>
          <button aria-label="ปิด" onClick={close}>
            <X size={22} />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            const value = {
              ...item,
              id: item?.id || crypto.randomUUID(),
              name: name.trim(),
              status,
              ...(modal.kind === "projects"
                ? { description: description.trim(), business }
                : modal.kind === "tasks"
                  ? { project, due, priority, department }
                  : { company: company.trim() }),
            };
            const next = {
              ...data,
              [modal.kind]: modal.id
                ? data[modal.kind].map((x) => (x.id === modal.id ? value : x))
                : [...data[modal.kind], value],
            };
            if (submit(next as Data)) close();
          }}
        >
          <label>
            ชื่อ
            {modal.kind === "projects"
              ? "โครงการ"
              : modal.kind === "tasks"
                ? "งาน"
                : "ลูกค้า"}{" "}
            *
            <input
              autoFocus
              required
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          {modal.kind === "projects" && (
            <label>
              รายละเอียด
              <textarea
                maxLength={1000}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          )}
          {modal.kind === "projects" && (
            <label>
              ประเภทธุรกิจ
              <select
                aria-label="ประเภทธุรกิจโครงการ"
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
              >
                <option value="">ยังไม่ระบุ</option>
                {businesses.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
          )}
          {modal.kind === "customers" && (
            <label>
              ธุรกิจ / องค์กร
              <input
                maxLength={150}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </label>
          )}
          {modal.kind === "tasks" && (
            <>
              <label>
                ฝ่ายธุรกิจงาน
                <select
                  aria-label="ฝ่ายธุรกิจงาน"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="">ยังไม่จัดฝ่าย</option>
                  {departments.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label>
                โครงการ
                <select
                  aria-label="โครงการ"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                >
                  <option value="">ไม่มีโครงการ</option>
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  วันครบกำหนด
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                  />
                </label>
                <label>
                  ความสำคัญ
                  <select
                    aria-label="ความสำคัญ"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    {["ต่ำ", "ปานกลาง", "สูง"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
          <label>
            สถานะ
            <select
              aria-label="สถานะ"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {states.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <p className="muted">
            ข้อมูลบันทึกเฉพาะเบราว์เซอร์นี้ กรุณาใช้ข้อมูลทดลอง
          </p>
          <div className="modal-footer">
            <button type="button" className="secondary" onClick={close}>
              ยกเลิก
            </button>
            <button type="submit" className="primary">
              บันทึกข้อมูล <Check size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
