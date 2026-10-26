import { test, expect, type Page } from "@playwright/test";
import { catalog } from "../src/features/catalog";
import { integrationState } from "../src/v2/providers";
import { compileWorkflowPlan } from "../src/v2/workflowPlan";
const navigate = async (page: Page, name: string) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
const legacy = {
  projects: [
    {
      id: "legacy-project",
      name: "โครงการเดิม",
      description: "ตัวอย่าง",
      status: "วางแผน",
    },
  ],
  tasks: [
    {
      id: "legacy-task",
      name: "งานเดิมที่ต้องรักษา",
      project: "legacy-project",
      due: "",
      priority: "สูง",
      status: "กำลังทำ",
      extraMetadata: "keep-me",
    },
  ],
  customers: [
    {
      id: "legacy-customer",
      name: "ลูกค้าสมมติเดิม",
      company: "บริษัทสมมติ",
      status: "ลูกค้าใหม่",
    },
  ],
};
const legacyBusiness = {
  version: 1,
  favorites: ["tool-claude"],
  customTools: [],
  costs: { "tool-chatgpt": 250 },
  entries: [],
  contents: [],
  workflows: [],
};
async function seedLegacy(page: Page) {
  await page.addInitScript(
    ({ legacy, business }) => {
      if (!localStorage.getItem("abbas-command-center-v1"))
        localStorage.setItem("abbas-command-center-v1", JSON.stringify(legacy));
      if (!localStorage.getItem("abbas-business-v1"))
        localStorage.setItem("abbas-business-v1", JSON.stringify(business));
    },
    { legacy, business: legacyBusiness },
  );
}
test("command drafts persist without modifying V1 or sending AI requests", async ({
  page,
}) => {
  await seedLegacy(page);
  const external: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:5173") &&
      !r.url().startsWith("ws://127.0.0.1:5173")
    )
      external.push(r.url());
  });
  await page.goto("/");
  await navigate(page, "AI Command Center");
  await expect(page.locator(".v2-provider")).toHaveCount(9);
  await expect(
    page.getByText("เชื่อมต่อจริง 0 รายการ", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "ส่งคำสั่ง AI (ยังไม่เปิดใช้)",
      exact: true,
    }),
  ).toBeDisabled();
  await page
    .getByLabel("ชื่องานคำสั่ง", { exact: true })
    .fill("วางแผนร้านสมมติ");
  await page
    .getByLabel("ข้อความคำสั่ง", { exact: true })
    .fill("สร้างแผนโปรโมชันสำหรับร้านอาหารสมมติ");
  await page
    .getByLabel("AI ที่วางแผนใช้", { exact: true })
    .selectOption("tool-gemini");
  await page.getByRole("button", { name: "บันทึกร่าง", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("ยังไม่ได้ส่งคำสั่ง");
  await page.reload();
  await navigate(page, "AI Command Center");
  await page
    .getByRole("button", { name: "เปิดร่าง วางแผนร้านสมมติ", exact: true })
    .click();
  await expect(page.getByLabel("ข้อความคำสั่ง", { exact: true })).toHaveValue(
    "สร้างแผนโปรโมชันสำหรับร้านอาหารสมมติ",
  );
  await expect(
    page.getByRole("link", { name: "เปิด Gemini ด้วยตนเอง", exact: true }),
  ).toHaveAttribute("href", "https://gemini.google.com");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("abbas-command-center-v1")!),
    ),
  ).toEqual(legacy);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("abbas-business-v1")!),
    ),
  ).toEqual(legacyBusiness);
  expect(external).toEqual([]);
});
test("operations update the original tasks and preserve customer, project and extra fields", async ({
  page,
}) => {
  await seedLegacy(page);
  await page.goto("/");
  await navigate(page, "งานธุรกิจ");
  await page
    .getByLabel("ฝ่ายของ งานเดิมที่ต้องรักษา", { exact: true })
    .selectOption("ร้านอาหาร");
  await page
    .getByLabel("สถานะงานธุรกิจ งานเดิมที่ต้องรักษา", { exact: true })
    .selectOption("เสร็จแล้ว");
  await page
    .getByRole("navigation")
    .getByRole("button", { name: /^งานทั้งหมด/ })
    .click();
  await page
    .getByRole("button", { name: "แก้ไข งานเดิมที่ต้องรักษา", exact: true })
    .click();
  await expect(page.getByLabel("ฝ่ายธุรกิจงาน", { exact: true })).toHaveValue(
    "ร้านอาหาร",
  );
  await page.getByLabel("ชื่องาน", { exact: false }).fill("งานเดิมหลังแก้ไข");
  await page.getByRole("button", { name: "บันทึกข้อมูล", exact: true }).click();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("abbas-command-center-v1")!),
  );
  expect(saved.projects).toEqual(legacy.projects);
  expect(saved.customers).toEqual(legacy.customers);
  expect(saved.tasks[0]).toMatchObject({
    id: "legacy-task",
    name: "งานเดิมหลังแก้ไข",
    department: "ร้านอาหาร",
    status: "เสร็จแล้ว",
    extraMetadata: "keep-me",
  });
  await page.reload();
  await navigate(page, "งานธุรกิจ");
  await expect(
    page.getByLabel("ฝ่ายของ งานเดิมหลังแก้ไข", { exact: true }),
  ).toHaveValue("ร้านอาหาร");
});
test("cost control separates verified facts from unknown plans and manual usage", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-26T05:00:00Z"));
  await page.goto("/");
  await navigate(page, "Cost Control");
  await expect(page.locator(".v2-cost-card")).toHaveCount(7);
  await expect(
    page
      .locator(".v2-cost-card")
      .filter({
        has: page.getByRole("heading", { name: "ChatGPT", exact: true }),
      }),
  ).toContainText("ยังไม่ยืนยันจากผู้ให้บริการ");
  const card = page
    .locator(".v2-cost-card")
    .filter({
      has: page.getByRole("heading", { name: "GitHub Copilot", exact: true }),
    });
  await expect(card).toContainText("2,000");
  await expect(card).toContainText("2026-10-26");
  await expect(card).toContainText("ไม่ใช่การรับรองว่าฟรีตลอดไป");
  await page.getByLabel("การใช้ GitHub Copilot", { exact: true }).fill("2000");
  await page
    .getByLabel("วันทดลอง GitHub Copilot", { exact: true })
    .fill("2026-10-25");
  await page
    .getByRole("button", {
      name: "บันทึกการติดตาม GitHub Copilot",
      exact: true,
    })
    .click();
  await expect(card).toContainText("ผ่านไปแล้ว");
  await expect(card).toContainText("ถึง/เกินโควตา");
  await page.reload();
  await navigate(page, "Cost Control");
  await expect(
    page.getByLabel("การใช้ GitHub Copilot", { exact: true }),
  ).toHaveValue("2000");
});
test("workflow plan export remains non-executable and existing workflows persist", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "Workflow จำลอง");
  await page.getByLabel("ชื่อ Workflow", { exact: true }).fill("แผน V2");
  await page
    .getByLabel("แผนงานขั้นที่ 1", { exact: true })
    .fill("วางแผนตัวอย่าง");
  await page
    .getByRole("button", { name: "บันทึก Workflow", exact: true })
    .click();
  const promise = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "ส่งออกแผน JSON", exact: true })
    .click();
  const download = await promise;
  const stream = await download.createReadStream();
  let text = "";
  for await (const chunk of stream!) text += chunk;
  const plan = JSON.parse(text);
  expect(plan).toMatchObject({
    schemaVersion: 2,
    mode: "draft_only",
    executionEnabled: false,
  });
  expect(plan.steps[0]).toMatchObject({
    requiresHumanReview: true,
    integrationState: "not_configured",
  });
  await page.reload();
  await navigate(page, "Workflow จำลอง");
  await expect(
    page.getByRole("button", { name: "เปิด Workflow แผน V2", exact: true }),
  ).toBeVisible();
});
test("corrupt V2 data is not overwritten", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem("abbas-command-center-v2", "broken-v2"),
  );
  await page.goto("/");
  await navigate(page, "AI Command Center");
  await expect(page.getByRole("alert")).toContainText("ปิดการบันทึก");
  await expect(
    page.getByRole("button", { name: "บันทึกร่าง", exact: true }),
  ).toBeDisabled();
  expect(
    await page.evaluate(() => localStorage.getItem("abbas-command-center-v2")),
  ).toBe("broken-v2");
});
test("V2 concurrent write and quota errors keep original data", async ({
  page,
}) => {
  await page.goto("/");
  await navigate(page, "AI Command Center");
  await page.getByLabel("ชื่องานคำสั่ง", { exact: true }).fill("ร่างใหม่");
  await page.getByLabel("ข้อความคำสั่ง", { exact: true }).fill("ข้อมูลสมมติ");
  const concurrent = JSON.stringify({ version: 2, drafts: [], accounts: {} });
  await page.evaluate(
    (value) => localStorage.setItem("abbas-command-center-v2", value),
    concurrent,
  );
  await page.getByRole("button", { name: "บันทึกร่าง", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("อีกแท็บ");
  expect(
    await page.evaluate(() => localStorage.getItem("abbas-command-center-v2")),
  ).toBe(concurrent);
  await page.reload();
  await navigate(page, "AI Command Center");
  await page
    .getByLabel("ชื่องานคำสั่ง", { exact: true })
    .fill("ร่างเก็บไม่ได้");
  await page
    .getByLabel("ข้อความคำสั่ง", { exact: true })
    .fill("ทดสอบพื้นที่เต็ม");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("quota");
    };
  });
  await page.getByRole("button", { name: "บันทึกร่าง", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("บันทึก V2 ไม่สำเร็จ");
  expect(
    await page.evaluate(() => localStorage.getItem("abbas-command-center-v2")),
  ).toBe(concurrent);
});
test("V2 mobile navigation and pages fit 390 and 320 pixels", async ({
  page,
}) => {
  await page.goto("/");
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    for (const name of [
      "AI Command Center",
      "งานธุรกิจ",
      "Cost Control",
      "Workflow จำลอง",
    ]) {
      await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
      await navigate(page, name);
      await expect
        .poll(() =>
          page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        )
        .toBe(true);
    }
  }
});
test("unverified adapters cannot execute and invalid workflow references fail", () => {
  expect(integrationState(catalog[0])).toBe("link_only");
  expect(integrationState(catalog[0], "execute")).toBe("unavailable");
  expect(integrationState(undefined)).toBe("unavailable");
  expect(() =>
    compileWorkflowPlan(
      {
        id: "w",
        name: "test",
        business: "demo",
        steps: [{ toolId: "missing", instruction: "test" }],
      },
      catalog,
    ),
  ).toThrow();
});
