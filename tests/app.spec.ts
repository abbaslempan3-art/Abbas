import { test, expect } from "@playwright/test";
test("project, task and customer CRUD persist and update reports", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "ภาพรวมธุรกิจของคุณ." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "สร้างโครงการ", exact: true }).click();
  await page.getByLabel("ชื่อโครงการ").fill("โครงการทดสอบ");
  await page.getByRole("button", { name: "บันทึกข้อมูล" }).click();
  await page.getByRole("button", { name: "โครงการ", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "โครงการทดสอบ", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "แก้ไข โครงการทดสอบ", exact: true })
    .click();
  await page.getByLabel("ชื่อโครงการ").fill("โครงการใหม่");
  await page.getByRole("button", { name: "บันทึกข้อมูล" }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "งานทั้งหมด", exact: false })
    .first()
    .click();
  await page.getByRole("button", { name: "เพิ่มงาน", exact: true }).click();
  await page.getByLabel("ชื่องาน").fill("งานทดสอบ");
  await page
    .getByLabel("โครงการ", { exact: true })
    .selectOption({ label: "โครงการใหม่" });
  await page.getByLabel("ความสำคัญ").selectOption("สูง");
  await page.getByLabel("วันครบกำหนด").fill("2025-01-01");
  await page.getByRole("button", { name: "บันทึกข้อมูล" }).click();
  await page
    .getByRole("button", { name: "เปลี่ยนสถานะ งานทดสอบ", exact: true })
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "งานทดสอบ" }),
  ).toContainText("เสร็จแล้ว");
  await page.getByRole("button", { name: "รายงาน", exact: true }).click();
  await expect(page.getByText("สำเร็จแล้ว 2 จาก 6 งาน")).toBeVisible();
  await page.getByRole("button", { name: "ลูกค้า CRM", exact: true }).click();
  await page.getByRole("button", { name: "เพิ่มลูกค้า", exact: true }).click();
  await page.getByLabel("ชื่อลูกค้า").fill("ลูกค้าทดสอบใหม่");
  await page.getByRole("button", { name: "บันทึกข้อมูล" }).click();
  await page.getByRole("button", { name: "แก้ไข ลูกค้าทดสอบใหม่" }).click();
  await page.getByLabel("สถานะ", { exact: true }).selectOption("ปิดการขาย");
  await page.getByRole("button", { name: "บันทึกข้อมูล" }).click();
  await expect(
    page.getByRole("row").filter({ hasText: "ลูกค้าทดสอบใหม่" }),
  ).toContainText("ปิดการขาย");
  page.on("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "ลบ ลูกค้าทดสอบใหม่" }).click();
  await expect(page.getByText("ลูกค้าทดสอบใหม่")).toHaveCount(0);
  await page.getByRole("button", { name: "โครงการ", exact: true }).click();
  await page
    .getByRole("button", { name: "ลบ โครงการใหม่", exact: true })
    .click();
  await page
    .getByRole("button", { name: "งานทั้งหมด", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("row").filter({ hasText: "งานทดสอบ" }),
  ).toContainText("ไม่มีโครงการ");
  await page.getByRole("button", { name: "ลบ งานทดสอบ", exact: true }).click();
  await expect(page.getByText("งานทดสอบ", { exact: true })).toHaveCount(0);
});
test("mobile navigation and unverified AI states", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
  await page
    .getByRole("button", { name: "เครื่องมือ AI", exact: true })
    .click();
  await expect(
    page.getByText("ลิงก์เท่านั้น · ยังไม่เชื่อมต่อ", { exact: true }),
  ).toHaveCount(44);
});
test("corrupt storage and failed writes show warnings", async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem("abbas-command-center-v1", "broken"),
  );
  await page.goto("/");
  await expect(page.getByRole("alert")).toContainText(
    "ไม่สามารถอ่านข้อมูลเดิม",
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("quota");
    };
  });
  await page.getByRole("button", { name: "สร้างโครงการ", exact: true }).click();
  await page.getByLabel("ชื่อโครงการ").fill("บันทึกไม่ได้");
  await page.getByRole("button", { name: "บันทึกข้อมูล" }).click();
  await expect(page.getByRole("alert")).toContainText("บันทึกไม่สำเร็จ");
  await expect(page.getByRole("dialog")).toBeVisible();
});
