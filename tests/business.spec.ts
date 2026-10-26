import { test, expect } from "@playwright/test";
import { catalog, categories, safeUrl } from "../src/features/catalog";
const navigate = async (page: import("@playwright/test").Page, name: string) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
test("catalog contains requested 44 distinct safe official links in six categories", () => {
  expect(catalog).toHaveLength(44);
  expect(new Set(catalog.map((t) => t.name)).size).toBe(44);
  expect(new Set(catalog.map((t) => t.url)).size).toBe(44);
  expect(
    categories.map((c) => catalog.filter((t) => t.category === c).length),
  ).toEqual([9, 5, 8, 10, 5, 7]);
  for (const t of catalog) {
    expect(safeUrl(t.url)).toBe(true);
    expect(t.jobs.length).toBeGreaterThan(0);
  }
  for (const url of [
    "javascript:alert(1)",
    "http://example.com",
    "https://user:password@example.com",
    "https://example.com?key=secret",
    "https://example.com#token",
    "https://localhost",
    "https://127.0.0.1",
    "https://192.168.1.2",
  ])
    expect(safeUrl(url)).toBe(false);
});
test("directory search, category, recommendations, favorites and costs persist", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "เครื่องมือ AI");
  await expect(page.locator(".directory-card")).toHaveCount(44);
  await page
    .getByRole("button", { name: "รายการโปรด ChatGPT", exact: true })
    .click();
  await page
    .getByRole("button", { name: "ตั้งงบ ChatGPT", exact: true })
    .click();
  await page.getByLabel("งบรายเดือน ChatGPT", { exact: true }).fill("750");
  await page
    .locator(".directory-card")
    .filter({
      has: page.getByRole("heading", { name: "ChatGPT", exact: true }),
    })
    .getByRole("button", { name: "บันทึก", exact: true })
    .click();
  await page
    .getByLabel("หมวดเครื่องมือ", { exact: true })
    .selectOption("Automation");
  await expect(page.locator(".directory-card")).toHaveCount(5);
  await page.getByRole("button", { name: "ล้างตัวกรอง", exact: true }).click();
  await page.getByLabel("ค้นหาเครื่องมือ", { exact: true }).fill("claude");
  await expect(page.locator(".directory-card")).toHaveCount(1);
  await page.getByRole("button", { name: "ล้างตัวกรอง", exact: true }).click();
  await page
    .getByLabel("ประเภทธุรกิจ", { exact: true })
    .selectOption("AI Kids Content Studio");
  await expect(page.locator(".directory-card")).toHaveCount(5);
  await page.getByRole("button", { name: "ล้างตัวกรอง", exact: true }).click();
  await page.reload();
  await navigate(page, "เครื่องมือ AI");
  await page
    .getByRole("button", { name: "รายการโปรด (1)", exact: true })
    .click();
  await expect(page.locator(".directory-card")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "ตั้งงบ ChatGPT" }),
  ).toContainText("750");
  await navigate(page, "รายรับและต้นทุน");
  await expect(
    page.locator(".executive-stat").filter({ hasText: "งบ AI รวมทุกธุรกิจ" }),
  ).toContainText("750");
});
test("custom tools validate URLs, reject duplicate names, support edit and removal", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "เครื่องมือ AI");
  await page
    .getByRole("button", { name: "เพิ่มเครื่องมือ", exact: true })
    .click();
  await page
    .getByLabel("ชื่อเครื่องมือ", { exact: true })
    .fill("เครื่องมือทดลอง");
  await page
    .getByLabel("เว็บไซต์ HTTPS", { exact: true })
    .fill("https://example.com?api_key=bad");
  await page
    .getByRole("button", { name: "บันทึกเครื่องมือ", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("ห้ามมี credentials");
  await page.getByLabel("ชื่อเครื่องมือ", { exact: true }).fill("ChatGPT");
  await page
    .getByLabel("เว็บไซต์ HTTPS", { exact: true })
    .fill("https://example.com");
  await page
    .getByRole("button", { name: "บันทึกเครื่องมือ", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "มีชื่อเครื่องมือนี้แล้ว",
  );
  await page
    .getByLabel("ชื่อเครื่องมือ", { exact: true })
    .fill("เครื่องมือทดลอง");
  await page
    .getByRole("button", { name: "บันทึกเครื่องมือ", exact: true })
    .click();
  await expect(page.locator(".directory-card")).toHaveCount(45);
  await page
    .getByRole("button", {
      name: "แก้ไขเครื่องมือ เครื่องมือทดลอง",
      exact: true,
    })
    .click();
  await page
    .getByLabel("ชื่อเครื่องมือ", { exact: true })
    .fill("เครื่องมือแก้ไข");
  await page
    .getByRole("button", { name: "บันทึกเครื่องมือ", exact: true })
    .click();
  await page.reload();
  await navigate(page, "เครื่องมือ AI");
  await expect(
    page.getByRole("heading", { name: "เครื่องมือแก้ไข", exact: true }),
  ).toBeVisible();
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "ลบเครื่องมือ เครื่องมือแก้ไข", exact: true })
    .click();
  await expect(page.locator(".directory-card")).toHaveCount(44);
});
test("finance CRUD filters months and sales pipeline preserves CRM", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "รายรับและต้นทุน");
  await page
    .getByRole("button", { name: "เพิ่มรายการเงิน", exact: true })
    .click();
  await page
    .getByLabel("ชื่อรายการ", { exact: true })
    .fill("เงินทดลองเท่านั้น");
  await page.getByLabel("จำนวนเงิน (บาท)", { exact: true }).fill("1200.50");
  await page.getByLabel("วันที่", { exact: true }).fill("2026-09-15");
  await page
    .getByRole("button", { name: "บันทึกรายการเงิน", exact: true })
    .click();
  await page.getByLabel("เดือนรายงาน", { exact: true }).fill("2026-09");
  await expect(
    page.getByRole("row").filter({ hasText: "เงินทดลองเท่านั้น" }),
  ).toContainText("1,200.50");
  await page
    .getByRole("button", {
      name: "แก้ไขรายการเงิน เงินทดลองเท่านั้น",
      exact: true,
    })
    .click();
  await page.getByLabel("ประเภท", { exact: true }).selectOption("expense");
  await page
    .getByRole("button", { name: "บันทึกรายการเงิน", exact: true })
    .click();
  await expect(
    page
      .locator(".executive-stat")
      .filter({ has: page.getByText("คงเหลือจากรายการ", { exact: true }) }),
  ).toContainText("-");
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", {
      name: "ลบรายการเงิน เงินทดลองเท่านั้น",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "เงินทดลองเท่านั้น" }),
  ).toHaveCount(0);
  await navigate(page, "ลูกค้า CRM");
  await page
    .getByLabel("สถานะการขาย ลูกค้าทดลอง A", { exact: true })
    .selectOption("ปิดการขาย");
  await expect(
    page.getByRole("row").filter({ hasText: "ลูกค้าทดลอง A" }),
  ).toContainText("ปิดการขาย");
  await page.reload();
  await navigate(page, "ลูกค้า CRM");
  await expect(
    page.getByLabel("สถานะการขาย ลูกค้าทดลอง A", { exact: true }),
  ).toHaveValue("ปิดการขาย");
});
test("content planner and workflow save and simulate without external requests", async ({
  page,
}) => {
  const outgoing: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5173") &&
      !r.url().startsWith("ws://127.0.0.1:5173")
    )
      outgoing.push(r.url());
  });
  await page.goto("/");
  await navigate(page, "แผนคอนเทนต์");
  await page
    .getByRole("button", { name: "เพิ่มคอนเทนต์", exact: true })
    .click();
  await page.getByLabel("หัวข้อคอนเทนต์", { exact: true }).fill("คลิปสมมติ");
  await page
    .getByRole("button", { name: "บันทึกแผนคอนเทนต์", exact: true })
    .click();
  await page
    .getByLabel("สถานะ คลิปสมมติ", { exact: true })
    .selectOption("รอตรวจทาน");
  await expect(
    page.locator(".content-column").filter({
      has: page.getByRole("heading", { name: "รอตรวจทาน", exact: false }),
    }),
  ).toContainText("คลิปสมมติ");
  await navigate(page, "Workflow จำลอง");
  await page.getByLabel("ชื่อ Workflow", { exact: true }).fill("แผนตัวอย่าง");
  await page
    .getByLabel("แผนงานขั้นที่ 1", { exact: true })
    .fill("วางแผนคอนเทนต์สมมติ");
  await page.getByRole("button", { name: "เพิ่มขั้นตอน", exact: true }).click();
  await page
    .getByLabel("เครื่องมือขั้นที่ 2", { exact: true })
    .selectOption({ label: "Canva" });
  await page
    .getByLabel("แผนงานขั้นที่ 2", { exact: true })
    .fill("ออกแบบภาพตัวอย่าง");
  await page.getByRole("button", { name: "จำลองแผน", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ไม่มีการเรียก API");
  await expect(page.locator(".simulation-step")).toHaveCount(2);
  await page
    .getByRole("button", { name: "บันทึก Workflow", exact: true })
    .click();
  await page.reload();
  await navigate(page, "Workflow จำลอง");
  await page
    .getByRole("button", { name: "เปิด Workflow แผนตัวอย่าง", exact: true })
    .click();
  await expect(page.getByLabel("แผนงานขั้นที่ 2", { exact: true })).toHaveValue(
    "ออกแบบภาพตัวอย่าง",
  );
  await page
    .getByRole("button", { name: "ย้ายขั้น 2 ขึ้น", exact: true })
    .click();
  await expect(
    page.getByLabel("เครื่องมือขั้นที่ 1", { exact: true }),
  ).toHaveValue("tool-canva");
  await navigate(page, "การเชื่อมต่อและตั้งค่า");
  await expect(
    page.getByText("เชื่อมต่อจริง 0 รายการ", { exact: true }),
  ).toBeVisible();
  expect(outgoing).toEqual([]);
});
test("business storage errors are visible and responsive modules stay within viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  for (const name of [
    "เครื่องมือ AI",
    "รายรับและต้นทุน",
    "แผนคอนเทนต์",
    "Workflow จำลอง",
    "ลูกค้า CRM",
    "การเชื่อมต่อและตั้งค่า",
  ]) {
    await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
    await navigate(page, name);
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await navigate(page, "เครื่องมือ AI");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
  });
  await page
    .getByRole("button", { name: "รายการโปรด ChatGPT", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "บันทึกข้อมูลธุรกิจไม่สำเร็จ",
  );
  await expect(
    page.getByRole("button", { name: "รายการโปรด ChatGPT", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
});
