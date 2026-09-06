import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-06T10:30:00Z") });
  await page.goto("/");
});

test("brand uses the same vector mark in the header and browser icon", async ({ page, request }) => {
  const brand = page.getByRole("link", { name: "تقویم، صفحهٔ اصلی" });
  const mark = brand.locator("img");
  await expect(mark).toHaveAttribute("src", "/icon.svg");
  await expect(mark).toHaveAttribute("alt", "");
  await expect(mark).toHaveJSProperty("naturalWidth", 64);
  const icon = page.locator('head link[rel="icon"][type="image/svg+xml"]');
  await expect(icon).toHaveAttribute("href", /^\/icon\.svg/);
  const response = await request.get((await icon.getAttribute("href"))!);
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
  expect(await response.text()).toContain('viewBox="0 0 64 64"');
});

test("calendar navigates, selects a day and returns to today", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "شهریور ۱۴۰۵", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "ماه بعد", exact: true }).click();
  await expect(page.getByRole("heading", { name: "مهر ۱۴۰۵", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "برگشت به امروز" }).click();
  await page.getByRole("button", { name: "۲۷ شهریور ۱۴۰۵", exact: true }).click();
  await expect(page.getByTestId("selected-date")).toContainText("۲۷ شهریور");
  await expect(page.getByTestId("selected-events")).toContainText("شهریار");
});

test("date conversion validates and converts actual dates", async ({ page }) => {
  await page.getByRole("button", { name: "تبدیل تاریخ", exact: true }).click();
  await page.getByLabel("سال", { exact: true }).fill("1403");
  await page.getByLabel("ماه", { exact: true }).selectOption("1");
  await page.getByLabel("روز", { exact: true }).fill("1");
  await page.getByRole("button", { name: "تبدیل کن" }).click();
  await expect(page.getByTestId("conversion-result")).toContainText("2024-03-20");
  await page.getByLabel("روز", { exact: true }).fill("32");
  await page.getByRole("button", { name: "تبدیل کن" }).click();
  await expect(page.locator("#tools").getByRole("alert")).toContainText("تاریخ معتبر نیست");
});

test("city choice changes prayer times and survives refresh", async ({ page }) => {
  const prayers = page.getByTestId("prayer-times");
  const before = await prayers.innerText();
  await page.getByLabel("انتخاب شهر").selectOption("mashhad");
  await expect(prayers).not.toHaveText(before);
  await page.reload();
  await expect(page.getByLabel("انتخاب شهر")).toHaveValue("mashhad");
});

test("calculates age and date distances", async ({ page }) => {
  await page.getByRole("tab", { name: "محاسبهٔ سن" }).click();
  await page.getByLabel("تولد سال").fill("۱۳۷۵");
  await page.getByLabel("تولد ماه").selectOption("3");
  await page.getByLabel("تولد روز").fill("۲۰");
  await page.getByRole("button", { name: "محاسبهٔ سن", exact: true }).click();
  await expect(page.locator("#tools").getByRole("status")).toContainText("۳۰ سال و ۲ ماه و ۲۶ روز");
  await page.getByRole("tab", { name: "فاصلهٔ دو تاریخ" }).click();
  await page.getByLabel("مبدأ سال").fill("1403");
  await page.getByLabel("مبدأ ماه").selectOption("12");
  await page.getByLabel("مبدأ روز").fill("30");
  await page.getByLabel("مقصد سال").fill("1404");
  await page.getByLabel("مقصد ماه").selectOption("1");
  await page.getByLabel("مقصد روز").fill("1");
  await page.getByRole("button", { name: "محاسبهٔ فاصله" }).click();
  await expect(page.locator("#tools").getByRole("status")).toContainText("۱ روز فاصله");
});

test("supported boundary months render and prevent out-of-range navigation", async ({ page }) => {
  await page.getByLabel("انتخاب ماه تقویم").selectOption("1");
  await page.getByLabel("انتخاب سال تقویم").selectOption("1200");
  await expect(page.getByRole("button", { name: "ماه قبل", exact: true })).toBeDisabled();
  await page.getByLabel("انتخاب سال تقویم").selectOption("1600");
  await page.getByLabel("انتخاب ماه تقویم").selectOption("12");
  await expect(page.getByRole("button", { name: "ماه بعد", exact: true })).toBeDisabled();
});

test("calendar days support RTL arrow navigation", async ({ page }) => {
  await page.getByRole("button", { name: "۱۵ شهریور ۱۴۰۵", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("button", { name: "۱۶ شهریور ۱۴۰۵", exact: true })).toBeFocused();
  await expect(page.getByTestId("selected-date")).toContainText("۱۶ شهریور");
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("button", { name: "۲۳ شهریور ۱۴۰۵", exact: true })).toBeFocused();
});

test("tool tabs support RTL keyboard navigation", async ({ page }) => {
  await page.getByRole("tab", { name: "تبدیل تاریخ‌ها" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "فاصلهٔ دو تاریخ" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "فاصلهٔ دو تاریخ" })).toHaveAttribute("aria-selected", "true");
});

test("today rolls over at Tehran midnight without waiting a full minute", async ({ page }) => {
  await page.clock.setSystemTime(new Date("2026-09-06T20:29:58Z"));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("۱۵ شهریور");
  await page.clock.runFor(3100);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("۱۶ شهریور");
  await expect(page.getByTestId("selected-date")).toContainText("۱۶ شهریور");
});

test("main workflows pass automated accessibility checks", async ({ page }) => {
  const result = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }))).toEqual([]);
});

test("page has no horizontal overflow or client errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.reload();
  await expect(page.getByRole("heading", { name: "شهریور ۱۴۰۵", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("non-Friday holidays are highlighted in red on the calendar grid", async ({ page }) => {
  await page.getByLabel("انتخاب ماه تقویم").selectOption("1");
  await page.getByLabel("انتخاب سال تقویم").selectOption("1405");
  // 1 Farvardin (Nowruz) is a holiday — not a Friday in 1405
  const nowruzCell = page.getByRole("button", { name: "۱ فروردین ۱۴۰۵", exact: true });
  await expect(nowruzCell).toBeVisible();
  // The holiday cell should have clay-colored text (red-ish), not the default ink color
  const textColor = await nowruzCell.evaluate((el) => getComputedStyle(el).color);
  expect(textColor).toContain("169, 80, 59"); // rgb for #a9503b (clay)
  // The background should be a light red/pink, not white
  const bgColor = await nowruzCell.evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(bgColor).toContain("252, 232, 227"); // rgb for #fce8e3
});
