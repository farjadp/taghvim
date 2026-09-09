// ============================================================================
// Source: tests/calendar.spec.ts
// Version: 0.9.16 — 2026-09-09
// Why: Browser tests: independent legend controls, migration, tools and navigation,
//      midnight rollover, accessibility, overflow, responsive layout, and the
//      crawler/install files served from the app router.
// Env / Deps: Playwright with a frozen clock; desktop + iPhone 13; E2E_PORT configurable.
// ============================================================================

import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every test starts at a fixed instant (6 Sep 2026, 14:00 Tehran) so dates are deterministic.
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

test("legend switches independently control state holidays and persist", async ({ page }) => {
  const calendar = page.getByRole("region", { name: "تقویم ماهانه" });
  const toggle = calendar.getByRole("switch", { name: "دولتی", exact: true });
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.locator("header").getByRole("switch")).toHaveCount(0);
  await expect(calendar.getByText("ملی و فرهنگی", { exact: true })).toBeVisible();
  await expect(calendar.getByRole("button", { name: "ملی و فرهنگی" })).toHaveCount(0);
  await page.getByLabel("انتخاب ماه تقویم").selectOption("11");
  const shaded = calendar.getByRole("group", { name: /روزهای ماه/ }).locator("button.bg-holiday");
  const bahman22 = page.getByRole("button", { name: "۲۲ بهمن ۱۴۰۵", exact: true });
  await expect(shaded).toHaveCount(5);
  await expect(bahman22).not.toHaveClass(/bg-holiday/);
  await toggle.click();
  await expect(shaded).toHaveCount(6);
  await expect(bahman22).toHaveClass(/bg-holiday/);
  await expect(calendar.getByRole("switch", { name: "مذهبی", exact: true })).toHaveAttribute("aria-checked", "false");
  await expect(page.getByTestId("prayer-times")).toHaveCount(0);
  await bahman22.click();
  await expect(page.getByTestId("selected-events")).toContainText("شورش ۵۷");
  await toggle.click();
  await expect(page.getByTestId("selected-events")).not.toContainText("شورش ۵۷");
  await toggle.click();
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
});

test("religious switch controls prayer navigation and panel without state occasions", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "مذهبی", exact: true });
  const prayerLink = page.getByRole("navigation", { name: "ناوبری اصلی" }).getByRole("link", { name: "اوقات شرعی" });
  await expect(prayerLink).toHaveCount(0);
  await expect(page.getByTestId("prayer-times")).toHaveCount(0);
  await toggle.click();
  await expect(prayerLink).toBeVisible();
  await expect(page.getByTestId("prayer-times")).toBeVisible();
  await expect(page.getByRole("switch", { name: "دولتی", exact: true })).toHaveAttribute("aria-checked", "false");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await expect(prayerLink).toBeVisible();
  await toggle.click();
  await expect(prayerLink).toHaveCount(0);
  await expect(page.getByTestId("prayer-times")).toHaveCount(0);
});

test("memorial can be hidden independently and restored after reload", async ({ page }) => {
  const toggle = page.getByRole("switch", { name: "یادبود", exact: true });
  await expect(toggle).toHaveAttribute("aria-checked", "true");
  await toggle.click();
  await expect(page.getByTestId("memorial")).toHaveCount(0);
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-checked", "false");
  await expect(page.getByTestId("memorial")).toHaveCount(0);
  await toggle.click();
  await expect(page.getByTestId("memorial")).toBeVisible();
  await expect(page.getByTestId("memorial")).toContainText("اینجا پیش‌تر اوقات شرعی را اعلام می‌کردیم.");
});

test("world switch removes events and its active list filter", async ({ page }) => {
  const list = page.locator("aside");
  await page.getByRole("button", { name: "۱۷ شهریور ۱۴۰۵", exact: true }).click();
  await expect(page.getByTestId("selected-events")).toContainText("سوادآموزی");
  await list.getByRole("button", { name: "جهانی", exact: true }).click();
  await page.getByRole("switch", { name: "جهانی", exact: true }).click();
  await expect(page.getByTestId("selected-events")).not.toContainText("سوادآموزی");
  await expect(list.getByRole("button", { name: "جهانی", exact: true })).toHaveCount(0);
  await expect(list.getByRole("button", { name: "همه", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(list).toContainText("شهریار");
  await page.reload();
  await expect(page.getByRole("switch", { name: "جهانی", exact: true })).toHaveAttribute("aria-checked", "false");
});

for (const legacy of ["secular", "all"]) {
  test(`migrates legacy ${legacy} preference on first read`, async ({ page }) => {
    await page.evaluate((value) => {
      localStorage.removeItem("taghvim-view");
      localStorage.setItem("taghvim-scope", value);
    }, legacy);
    await page.reload();
    await expect(page.getByRole("switch", { name: "مذهبی", exact: true })).toHaveAttribute("aria-checked", String(legacy === "all"));
    await expect(page.getByRole("switch", { name: "دولتی", exact: true })).toHaveAttribute("aria-checked", String(legacy === "all"));
    expect(await page.evaluate(() => localStorage.getItem("taghvim-scope"))).toBeNull();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem("taghvim-view")!))).toEqual({
      religious: legacy === "all", state: legacy === "all", world: true, memorial: true,
    });
  });
}

test("blocked storage still allows independent in-memory switches", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", { get() { throw new Error("Storage blocked"); } });
  });
  await page.reload();
  await page.getByRole("switch", { name: "مذهبی", exact: true }).click();
  await expect(page.getByTestId("prayer-times")).toBeVisible();
  await page.getByRole("switch", { name: "یادبود", exact: true }).click();
  await expect(page.getByTestId("memorial")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("memorial shows one identified person with a link to the source page", async ({ page }) => {
  const memorial = page.getByTestId("memorial");
  await expect(memorial).toBeVisible();
  await expect(page.getByTestId("memorial-name")).not.toBeEmpty();
  await expect(memorial.getByRole("link", { name: /جاویدنامان/ })).toHaveAttribute("href", /^https:\/\/javidnaman\.iranintl\.com\/memorial\//);
  await expect(memorial.getByText("اینجا پیش‌تر اوقات شرعی را اعلام می‌کردیم.")).toBeVisible();
});

test("city choice changes prayer times and survives refresh", async ({ page }) => {
  // Prayer times only render inside the religious scope
  await page.getByRole("switch", { name: "مذهبی", exact: true }).click();
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
  await page.getByRole("tab", { name: "تعطیلات پیوسته" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "روزشمار" })).toBeFocused();
  await expect(page.getByRole("tab", { name: "روزشمار" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "تعطیلات پیوسته" })).toHaveAttribute("aria-selected", "true");
});

test("today rolls over at Tehran midnight without waiting a full minute", async ({ page }) => {
  await page.clock.setSystemTime(new Date("2026-09-06T20:29:58Z"));
  await page.reload();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("۱۵ شهریور");
  await page.clock.runFor(3100);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("۱۶ شهریور");
  await expect(page.getByTestId("selected-date")).toContainText("۱۶ شهریور");
});

test("main workflows pass automated accessibility checks in both themes", async ({ page }) => {
  const audit = async () => {
    const result = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    return result.violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  };
  expect(await audit()).toEqual([]);
  await page.getByRole("switch", { name: "مذهبی", exact: true }).click();
  await page.getByRole("switch", { name: "دولتی", exact: true }).click();
  await page.getByRole("switch", { name: "جهانی", exact: true }).click();
  await page.getByRole("switch", { name: "یادبود", exact: true }).click();
  await page.waitForTimeout(400);
  expect(await audit()).toEqual([]);
  // Same page, dark palette: every token has a dark counterpart and must still pass contrast
  await page.getByRole("button", { name: "تنظیمات نمایش" }).click();
  await page.getByRole("group", { name: "پوسته" }).getByRole("button", { name: "تیره" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  // Colours animate for 150ms (transition-colors); auditing mid-transition reads blended values
  await page.waitForTimeout(400);
  expect(await audit()).toEqual([]);
  for (const name of ["مذهبی", "دولتی", "جهانی", "یادبود"]) {
    await page.getByRole("switch", { name, exact: true }).click();
  }
  await page.waitForTimeout(400);
  expect(await audit()).toEqual([]);
});

test("display settings apply immediately and survive reload", async ({ page }) => {
  const html = page.locator("html");
  await expect(html).not.toHaveAttribute("data-theme", /.+/);
  await page.getByRole("button", { name: "تنظیمات نمایش" }).click();
  await page.getByRole("group", { name: "پوسته" }).getByRole("button", { name: "تیره" }).click();
  await page.getByRole("group", { name: "اندازهٔ قلم" }).getByRole("button", { name: "بزرگ" }).click();
  await page.getByRole("group", { name: "قلم" }).getByRole("button", { name: "شبنم" }).click();
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(html).toHaveAttribute("data-size", "lg");
  await expect(html).toHaveAttribute("data-font", "shabnam");
  expect(await html.evaluate((el) => getComputedStyle(el).fontSize)).toBe("18px");
  expect(await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Shabnam");
  expect(await page.locator("body").evaluate((el) => getComputedStyle(el).backgroundColor)).toBe("rgb(18, 26, 22)");
  await page.reload();
  // The boot script must restore all three before React hydrates
  await expect(html).toHaveAttribute("data-theme", "dark");
  await expect(html).toHaveAttribute("data-size", "lg");
  await expect(html).toHaveAttribute("data-font", "shabnam");
});

test("secondary pages carry the same settings menu", async ({ page }) => {
  await page.goto("/about");
  await expect(page.getByRole("button", { name: "تنظیمات نمایش" })).toBeVisible();
});

test.describe("second clock", () => {
  // The device zone is the only input; Playwright can set it per context
  test.use({ timezoneId: "America/Toronto" });

  test("adds the visitor's own clock and lets them pin up to two cities", async ({ page }) => {
    const clocks = page.getByTestId("world-clocks");
    await expect(clocks).toBeVisible();
    await expect(clocks).toContainText("تورنتو (شما)");
    await expect(clocks).toContainText("۷:۳۰ ساعت عقب‌تر");
    // The hero's Tehran clock stays the main one
    await expect(page.getByText("ساعت ایران")).toBeVisible();

    await clocks.getByRole("button", { name: "افزودن شهر" }).click();
    await clocks.getByRole("button", { name: "لندن", exact: true }).click();
    await expect(clocks).toContainText("لندن");

    await clocks.getByRole("button", { name: "افزودن شهر" }).click();
    await clocks.getByRole("button", { name: "توکیو", exact: true }).click();
    // Two is the cap, so the add control goes away
    await expect(clocks.getByRole("button", { name: "افزودن شهر" })).toHaveCount(0);

    await page.reload();
    await expect(page.getByTestId("world-clocks")).toContainText("لندن");
    await expect(page.getByTestId("world-clocks")).toContainText("توکیو");

    await page.getByTestId("world-clocks").getByRole("button", { name: "حذف لندن" }).click();
    await expect(page.getByTestId("world-clocks")).not.toContainText("لندن");
  });
});

test("shows the zodiac sign of the current Persian month", async ({ page }) => {
  const card = page.getByTestId("other-calendars");
  // Shahrivar is Virgo; the frozen clock puts us in Shahrivar 1405
  await expect(card).toContainText("برج فلکی");
  await expect(card).toContainText("سنبله");
  await expect(card).toContainText("عنصر خاک");
  await expect(card).toContainText("طالع‌بینی");
  // Drawn as SVG, never as a font character or emoji
  expect(await card.locator("svg").count()).toBeGreaterThan(1);
  await expect(page.locator("body")).not.toContainText("♍");
});

test.describe("inside Iran", () => {
  test.use({ timezoneId: "Asia/Tehran" });

  test("shows no second clock, only a quiet way to add one", async ({ page }) => {
    await expect(page.getByTestId("world-clocks")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "افزودن ساعت شهر دیگر" })).toBeVisible();
  });
});

test("changelog is reachable from the footer and lists releases with dates", async ({ page }) => {
  await page.getByRole("contentinfo").getByRole("link", { name: "تغییرات و نسخه‌ها" }).click();
  await expect(page).toHaveURL(/\/changelog$/);
  await expect(page.getByRole("heading", { name: "تغییرات", level: 1 })).toBeVisible();
  // Newest release first, each with a Persian date and a Tehran clock time
  const releases = page.getByRole("main").getByRole("listitem").filter({ has: page.locator("time[datetime]") });
  expect(await releases.count()).toBeGreaterThan(1);
  await expect(releases.first()).toContainText("ساعت");
  // exact: a release is titled «آنچه در راه است», which also contains this text
  await expect(page.getByRole("heading", { name: "در راه", exact: true })).toBeVisible();
});

test("changelog passes accessibility checks in both themes", async ({ page }) => {
  await page.goto("/changelog");
  const audit = async () => (await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze())
    .violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
  expect(await audit()).toEqual([]);
  // The release chips introduce colour pairs the home page does not use
  await page.getByRole("button", { name: "تنظیمات نمایش" }).click();
  await page.getByRole("group", { name: "پوسته" }).getByRole("button", { name: "تیره" }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  expect(await audit()).toEqual([]);
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

test("legend controls fit the card and remain keyboard accessible", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === "mobile";
  if (!mobile) await page.setViewportSize({ width: 1280, height: 1100 });
  await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "light" });
  await page.evaluate(() => document.fonts.ready);
  const calendar = page.getByRole("region", { name: "تقویم ماهانه" });
  const controls = page.getByTestId("view-controls");
  const legend = page.getByTestId("calendar-legend");
  await expect(controls.getByRole("switch")).toHaveCount(4);
  const sizes = await calendar.evaluate((card) => {
    const block = card.querySelector<HTMLElement>('[data-testid="calendar-legend"]')!;
    const row = block.querySelector<HTMLElement>('[data-testid="view-controls"]')!;
    const box = card.getBoundingClientRect();
    const fullHeight = block.getBoundingClientRect().height;
    const classes = row.className;
    row.className = "hidden";
    const baseHeight = block.getBoundingClientRect().height;
    row.className = classes;
    return { width: box.width, height: box.height, legend: fullHeight, increase: fullHeight - baseHeight };
  });
  if (!mobile) {
    expect(sizes.width).toBeGreaterThan(727);
    expect(sizes.width).toBeLessThan(729);
    expect(sizes.increase).toBeGreaterThanOrEqual(30);
    expect(sizes.increase).toBeLessThanOrEqual(40);
  }
  console.log(`${testInfo.project.name} legend dimensions: ${JSON.stringify(sizes)}`);
  const religious = controls.getByRole("switch", { name: "مذهبی", exact: true });
  await religious.focus();
  await page.keyboard.press("Space");
  await expect(religious).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Tab");
  await expect(controls.getByRole("switch", { name: "دولتی", exact: true })).toBeFocused();
  await calendar.screenshot({ path: testInfo.outputPath("legend-light.png") });
  await page.getByRole("button", { name: "تنظیمات نمایش" }).click();
  await page.getByRole("group", { name: "پوسته" }).getByRole("button", { name: "تیره" }).click();
  await page.getByRole("group", { name: "اندازهٔ قلم" }).getByRole("button", { name: "بزرگ" }).click();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  await calendar.screenshot({ path: testInfo.outputPath("legend-dark-large.png") });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await legend.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
  for (const toggle of await controls.getByRole("switch").all()) {
    await expect(toggle).toBeVisible();
    const bounds = await toggle.boundingBox();
    expect(bounds!.height).toBeGreaterThanOrEqual(24);
  }
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

// The launch thread asked eight times what makes this different from time.ir and
// the site never said. The footer now carries the one link to that answer.
test("the footer answers why the calendar is built this way", async ({ page }) => {
  const link = page.getByRole("contentinfo").getByRole("link", { name: /چرا این تقویم با بقیه فرق دارد/ });
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(/\/about#why$/);
  const section = page.locator("#why");
  await expect(section.getByRole("heading", { name: "چرا ساخته شد؟" })).toBeVisible();
  // The reasoning must be in view, not merely present somewhere down the page
  // `html` scrolls smoothly, so the jump to the anchor is still animating when
  // the assertions above finish; poll instead of reading the position once.
  await expect.poll(() => section.evaluate((el) => el.getBoundingClientRect().top < window.innerHeight)).toBe(true);
});

test("serves a manifest, sitemap and robots that agree with each other", async ({ request, baseURL }) => {
  const manifestResponse = await request.get("/manifest.webmanifest");
  expect(manifestResponse.status()).toBe(200);
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.dir).toBe("rtl");
  // Every icon the manifest names must actually be served, at the size it claims
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src);
    expect(image.status(), `${icon.src} is missing`).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/png");
  }
  expect((await request.get("/apple-icon.png")).status()).toBe(200);

  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).toContain("Allow: /");
  expect(robots).toContain("Sitemap: https://taghv.im/sitemap.xml");

  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const path of ["/", "/about", "/contact", "/changelog"]) {
    expect(sitemap, `${path} missing from sitemap`).toContain(`<loc>https://taghv.im${path}</loc>`);
  }
  // Nothing in the sitemap may 404 on the server that is actually running
  for (const path of ["/", "/about", "/contact", "/changelog"]) {
    expect((await request.get(`${baseURL}${path}`)).status(), path).toBe(200);
  }
});

test("every page links the manifest and the apple touch icon", async ({ page }) => {
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
});

// The month grid used to start at 942px on a 664px-tall phone screen, so the page
// people open to see a calendar opened on everything except the calendar.
test("puts the month grid first on phones and leaves the desktop order alone", async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === "mobile";
  if (!mobile) await page.setViewportSize({ width: 1280, height: 900 });
  const positions = await page.evaluate(() => {
    const main = document.querySelector("main")!;
    const top = (el: Element) => Math.round(el.getBoundingClientRect().top + window.scrollY);
    return {
      calendar: top(document.querySelector("#calendar")!),
      hero: top(document.querySelector('[aria-label="تاریخ و ساعت امروز"]')!),
      tools: top(document.querySelector("#tools")!),
      display: getComputedStyle(main).display,
    };
  });
  if (mobile) {
    // Calendar above the hero, and the hero still above the tools below it
    expect(positions.calendar).toBeLessThan(positions.hero);
    expect(positions.hero).toBeLessThan(positions.tools);
    expect(positions.calendar).toBeLessThan(300);
  } else {
    // Desktop keeps normal flow: hero row first, then the calendar row
    expect(positions.display).toBe("block");
    expect(positions.hero).toBeLessThan(positions.calendar);
    expect(positions.calendar).toBeLessThan(positions.tools);
  }
});

// The two commercial faces are variable and only fetched when chosen; the FaNum
// builds in the same packages would have rewritten the Gregorian digits.
test("the added fonts load only when picked and leave Latin digits alone", async ({ page }) => {
  const gregorian = page.getByTestId("other-calendars").locator('p[dir="ltr"]').first();
  // The server renders the real date and the frozen clock replaces it on
  // hydration, so settle on the frozen value before comparing anything.
  await expect(gregorian).toHaveText("2026-09-06");
  const familiesLoaded = () => page.evaluate(() => [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family));
  expect(await familiesLoaded()).not.toContain("IRANYekanX");

  await page.getByRole("button", { name: "تنظیمات نمایش" }).click();
  await page.getByRole("group", { name: "قلم" }).getByRole("button", { name: "ایران‌یکان" }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-font", "iranyekan");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.locator("body").evaluate((el) => getComputedStyle(el).fontFamily)).toContain("IRANYekanX");
  expect(await familiesLoaded()).toContain("IRANYekanX");
  // Still Latin: a FaNum build would have turned these into ۲۰۲۶-۰۹-۰۶
  await expect(gregorian).toHaveText("2026-09-06");
  expect(await gregorian.textContent()).toMatch(/^\d{4}-\d{2}-\d{2}$/);

  // Survives a reload, and the pre-paint boot script applies it before hydration
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-font", "iranyekan");
});

// A subscription feed is added once and never looked at again, so the checks
// that matter are the ones a calendar client would make.
test("serves a subscribable calendar feed that a client can parse", async ({ request }) => {
  const response = await request.get("/calendar.ics");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("text/calendar");
  const feed = await response.text();

  expect(feed.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
  expect(feed.trimEnd().endsWith("END:VCALENDAR")).toBe(true);
  // CRLF only, and no line longer than the 75 octets RFC 5545 allows
  expect(feed.replace(/\r\n/g, "")).not.toContain("\n");
  for (const line of feed.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);

  const unfolded = feed.replace(/\r\n[ \t]/g, "");
  const uids = [...unfolded.matchAll(/^UID:(.*)$/gm)].map((match) => match[1]);
  expect(uids.length).toBeGreaterThan(100);
  expect(new Set(uids).size).toBe(uids.length);
  expect(unfolded).toContain("نوروز");
  // Solar only: nothing in here may depend on sighting the crescent
  expect(unfolded).not.toContain("عاشورا");
  expect(unfolded).not.toContain("۲۲ بهمن");
});

test("the help page carries the feed URL and the footer points at it", async ({ page }) => {
  await page.getByRole("contentinfo").getByRole("link", { name: "افزودن به تقویم گوگل و اپل" }).click();
  await expect(page).toHaveURL(/\/help#subscribe$/);
  const section = page.locator("#subscribe");
  await expect(section).toContainText("https://taghv.im/calendar.ics");
  // The caveat has to travel with the URL, not live somewhere else on the page
  await expect(section).toContainText("قمری");
});

test("the help page lists every section and its contents match", async ({ page }) => {
  await page.goto("/help");
  const contents = page.getByRole("navigation", { name: "فهرست راهنما" }).getByRole("link");
  const sections = page.locator("main section[id]");
  const count = await contents.count();
  expect(count).toBeGreaterThanOrEqual(9);
  expect(await sections.count()).toBe(count);
  // Every entry must point at a section that exists on the page
  for (const link of await contents.all()) {
    const href = await link.getAttribute("href");
    await expect(page.locator(`main section${href!.replace("#", "#")}`)).toHaveCount(1);
  }
  const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map(({ id }) => id)).toEqual([]);
});

// The social card is the first thing anyone sees of this site on X or Telegram,
// and it is the one page element nobody ever looks at while developing.
test("every page carries a complete social preview", async ({ page, request, baseURL }) => {
  for (const path of ["/", "/help", "/about"]) {
    await page.goto(path);
    const content = (selector: string) => page.locator(selector).getAttribute("content");
    expect(await content('meta[property="og:image"]'), path).toBe("https://taghv.im/og.png");
    expect(await content('meta[property="og:image:width"]')).toBe("1200");
    expect(await content('meta[property="og:image:height"]')).toBe("630");
    // Alt is the part the file-based convention silently dropped
    expect((await content('meta[property="og:image:alt"]'))?.length).toBeGreaterThan(20);
    expect(await content('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(await content('meta[property="og:locale"]')).toBe("fa_IR");
  }

  const image = await request.get(`${baseURL}/og.png`);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
  const body = await image.body();
  // PNG header: the IHDR chunk carries the real dimensions, so a resized file
  // cannot pass while the meta tags still claim 1200x630.
  expect(body.readUInt32BE(16)).toBe(1200);
  expect(body.readUInt32BE(20)).toBe(630);
});

// Machines read these and people never see them, so the only way they stay
// right is a test. Every secondary page shared the home page's og:title before.
test("every page has its own canonical, its own og:title and valid structured data", async ({ page }) => {
  const routes = [
    { path: "/", crumb: false },
    { path: "/help", crumb: true },
    { path: "/about", crumb: true },
    { path: "/changelog", crumb: true },
    { path: "/contact", crumb: true },
  ];
  const seen = new Set<string>();

  for (const { path, crumb } of routes) {
    await page.goto(path);
    const title = await page.title();
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute("content");

    expect(canonical, path).toBe(`https://taghv.im${path === "/" ? "" : path}`);
    expect(ogTitle, path).toBe(title);
    expect(seen.has(ogTitle!), `${path} repeats another page's og:title`).toBe(false);
    seen.add(ogTitle!);

    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsed = blocks.map((block) => JSON.parse(block));
    // The site graph is in the layout, so it is on every page
    const graph = parsed.find((node) => Array.isArray(node["@graph"]));
    expect(graph["@graph"].map((node: { "@type": string }) => node["@type"])).toEqual(["WebSite", "WebApplication"]);
    const breadcrumb = parsed.find((node) => node["@type"] === "BreadcrumbList");
    expect(Boolean(breadcrumb), path).toBe(crumb);
    if (breadcrumb) expect(breadcrumb.itemListElement).toHaveLength(2);
  }
});

// The Chrome Web Store listing links here, so it has to exist and has to be
// honest about the one request the site does make.
test("the privacy section is reachable and names the one external request", async ({ page }) => {
  await page.getByRole("contentinfo").getByRole("link", { name: "حریم خصوصی" }).click();
  await expect(page).toHaveURL(/\/about#privacy$/);
  const section = page.locator("#privacy");
  await expect(section.getByRole("heading", { name: "حریم خصوصی" })).toBeVisible();
  // Not rounded down to "no third-party requests": the memorial photo is one
  await expect(section).toContainText("عکس بخش یادبود");
  await expect(section).toContainText("افزونهٔ کروم");
  // `html` scrolls smoothly, so the jump to the anchor is still animating when
  // the assertions above finish; poll instead of reading the position once.
  await expect.poll(() => section.evaluate((el) => el.getBoundingClientRect().top < window.innerHeight)).toBe(true);
});

// The only channel there is. If the buttons stop being real mailto links, or
// the address stops being printed for machines with no mail client, a report
// simply never arrives and nothing here would otherwise notice.
test("the help page offers a working way to report a bug or ask for a feature", async ({ page }) => {
  await page.getByRole("contentinfo").getByRole("link", { name: "گزارش اشکال یا پیشنهاد" }).click();
  await expect(page).toHaveURL(/\/help#feedback$/);
  const section = page.locator("#feedback");
  await expect(section).toBeVisible();

  const bug = section.getByRole("link", { name: "گزارش اشکال" });
  const idea = section.getByRole("link", { name: "پیشنهاد یک قابلیت" });
  const href = async (link: typeof bug) => (await link.getAttribute("href")) ?? "";

  // Both open a mail app rather than posting anywhere: no form, no endpoint
  for (const link of [bug, idea]) expect(await href(link)).toMatch(/^mailto:[^?]+\?/);
  await expect(page.locator("form")).toHaveCount(0);

  // The bug report carries the page and the browser; the feature request does not
  const bugBody = new URLSearchParams((await href(bug)).split("?")[1]).get("body") ?? "";
  expect(bugBody).toContain("صفحه: /help");
  expect(bugBody).toContain("مرورگر: ");
  expect(bugBody).toContain("نسخه: ");
  const ideaBody = new URLSearchParams((await href(idea)).split("?")[1]).get("body") ?? "";
  expect(ideaBody).not.toContain("مرورگر: ");

  // A mailto button does nothing without a configured mail client, so the
  // address is printed as text beside it
  await expect(section).toContainText("farjad@ashavid.ca");

  const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map(({ id }) => id)).toEqual([]);
});

// The page exists to tell people how to get the calendar, and its whole value
// is that it does not claim something that is not built.
test("the download page states each method's real status", async ({ page }) => {
  // The home page has its own header — the app shell's, not SiteHeader's — and
  // it carries no link here. The footer is the only path from the home page.
  await page.getByRole("contentinfo").getByRole("link", { name: "دریافت تقویم" }).click();
  await expect(page).toHaveURL(/\/download$/);
  // Secondary pages do get it in the header
  await expect(page.getByRole("banner").getByRole("link", { name: "دریافت", exact: true })).toBeVisible();

  const status = async (id: string) => (await page.locator(`#${id}`).locator("span").filter({ hasText: /آماده|بازبینی|ساخته نشده/ }).first().textContent())?.trim();
  expect(await status("home-screen")).toBe("آماده");
  expect(await status("calendar-feed")).toBe("آماده");
  // Published on the Web Store since 9 Sep; before that this read «در حال بازبینی»
  expect(await status("chrome")).toBe("آماده");
  expect(await status("android")).toBe("هنوز ساخته نشده");

  // The store link exists now, and it is the real listing rather than a search
  // page or a placeholder — a dead button here is worse than a sentence.
  const store = page.locator('a[href*="chromewebstore.google.com"]');
  await expect(store).toHaveCount(1);
  await expect(store).toHaveAttribute("href", /\/detail\/[^/]+\/idfklcgaapfagcichjeonihhbkcfggim$/);
  await expect(store).toHaveAttribute("rel", /noopener/);
  // The honest caveats travel with their methods
  await expect(page.locator("#home-screen")).toContainText("آفلاین");
  await expect(page.locator("#calendar-feed")).toContainText("قمری");

  const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map(({ id }) => id)).toEqual([]);
});

test("the tools box opens on continuous holidays, caps them at three, and links to the full page", async ({ page }) => {
  const tools = page.locator("#tools");
  // The default tab, without anyone clicking anything.
  await expect(page.getByRole("tab", { name: "تعطیلات پیوسته" })).toHaveAttribute("aria-selected", "true");
  // 6 Sep 2026 with the default groups: the next twelve months hold only the Nowruz runs.
  const cards = tools.getByTestId("bridge");
  expect(await cards.count()).toBeGreaterThan(0);
  expect(await cards.count()).toBeLessThanOrEqual(3);
  await expect(cards.first()).toContainText("نوروز");
  // Every leave day is marked as such, and only leave days are.
  for (const card of await cards.all()) {
    const leave = await card.locator("li[aria-label*='مرخصی']").count();
    const priced = /با (\S+) روز مرخصی/.exec((await card.textContent()) ?? "");
    expect(leave).toBe(priced ? ["۱", "۲"].indexOf(priced[1]) + 1 : 0);
  }
  // Switching on the religious group adds runs, but never more than three are shown.
  const before = await tools.getByTestId("bridges-count").textContent();
  await page.getByRole("switch", { name: "مذهبی" }).click();
  await expect(tools.getByTestId("bridges-count")).not.toHaveText(before!);
  expect(await cards.count()).toBeLessThanOrEqual(3);
  await expect(tools.getByText("ممکن است یک روز جابه‌جا شود").first()).toBeVisible();

  // The countdown tab counts in whole days and never claims an instant.
  await page.getByRole("tab", { name: "روزشمار" }).click();
  await expect(tools.getByText("نوروز").first()).toBeVisible();
  await expect(tools.getByText(/\d|[۰-۹]/).first()).toBeVisible();
  await expect(tools.locator("summary", { hasText: "دربارهٔ این شمارش" })).toBeVisible();
  await expect(cards).toHaveCount(0);

  // Back to the first tab, then through the link to the full page, which reads the same switches.
  await page.getByRole("tab", { name: "تعطیلات پیوسته" }).click();
  await tools.getByRole("link", { name: /بازهٔ دیگر|کل سال/ }).click();
  await expect(page).toHaveURL(/\/bridges$/);
  await expect(page.getByRole("heading", { level: 1, name: "تعطیلات پیوسته" })).toBeVisible();
  await expect(page.getByTestId("bridges-summary")).not.toContainText("مذهبی و دولتی خاموش");
  const full = page.getByTestId("bridge");
  expect(await full.count()).toBeGreaterThan(3);

  // The year view above the list, drawn from the same runs the cards describe.
  await expect(page.getByRole("group", { name: /فروردین ۱۴۰۵/ })).toBeVisible();
  expect(await page.getByRole("group", { name: /۱۴۰۵$/ }).count()).toBe(12);
  const listed = new Set(await page.locator("[data-testid=bridge] li[aria-label*='مرخصی']").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("aria-label")!.replace(/^\S+ /, "").replace(" — مرخصی", ""))));
  const marked = await page.locator("[title$='— روز مرخصی']").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("title")!.replace(" — روز مرخصی", "")));
  expect(marked.length).toBeGreaterThan(0);
  for (const day of marked) expect(listed.has(day)).toBe(true);
  await expect(page.locator("[title$='— امروز']")).toHaveCount(1);
  await page.getByRole("button", { name: "۱۴۰۶" }).click();
  await expect(page.getByRole("heading", { name: "سال ۱۴۰۶" })).toBeVisible();
  expect(await full.count()).toBeGreaterThan(0);
  expect(await page.getByRole("group", { name: /۱۴۰۶$/ }).count()).toBe(12);
  await expect(page.locator("[title$='— امروز']")).toHaveCount(0);
  const audit = await new AxeBuilder({ page }).include("main").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map(({ id }) => id)).toEqual([]);
});

test("personal dates live in the tools box, are stored in the browser and mark the calendar", async ({ page }) => {
  // Nothing is written until something is entered: an untouched visitor stores no content.
  expect(await page.evaluate(() => window.localStorage.getItem("taghvim-dates"))).toBeNull();
  await expect(page.getByRole("region", { name: "تقویم ماهانه" }).getByText("تاریخ‌های من")).toHaveCount(0);

  // Reachable from the tab strip itself, not from inside another tab.
  const tools = page.locator("#tools");
  await page.getByRole("tab", { name: "تاریخ‌های من" }).click();
  await expect(tools.getByLabel("عنوان")).toBeVisible();

  await tools.getByLabel("عنوان").fill("تولد مریم");
  await tools.getByLabel("روز", { exact: true }).fill("21");
  await tools.getByLabel("ماه", { exact: true }).selectOption("6");
  await tools.getByLabel("سال", { exact: true }).fill("1370");
  await tools.getByRole("button", { name: "افزودن", exact: true }).click();
  await expect(tools.getByText("تولد مریم")).toBeVisible();
  await expect(tools.getByText("۳۵ ساله می‌شود")).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(window.localStorage.getItem("taghvim-dates") ?? "[]"));
  expect(stored).toHaveLength(1);
  expect(stored[0]).toMatchObject({ title: "تولد مریم", month: 6, day: 21, year: 1370, kind: "birthday" });

  // A bad date is refused in Persian and writes nothing.
  await tools.getByLabel("عنوان").fill("بد");
  await tools.getByLabel("روز", { exact: true }).fill("40");
  await tools.getByRole("button", { name: "افزودن", exact: true }).click();
  await expect(tools.getByRole("alert")).toContainText("تاریخ معتبر نیست");
  expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem("taghvim-dates") ?? "[]"))).toHaveLength(1);

  // The day is marked on the calendar, and the legend explains the mark.
  const calendar = page.getByRole("region", { name: "تقویم ماهانه" });
  await expect(calendar.getByText("تاریخ‌های من")).toBeVisible();
  await expect(calendar.getByRole("button", { name: "۲۱ شهریور ۱۴۰۵" }).locator("span.absolute.left-1\\.5")).toHaveCount(1);
  await expect(calendar.getByRole("button", { name: "۲۲ شهریور ۱۴۰۵" }).locator("span.absolute.left-1\\.5")).toHaveCount(0);

  // A hash opens the tool directly, so a link can point at it.
  await page.goto("/#dates");
  await expect(page.getByRole("tab", { name: "تاریخ‌های من" })).toHaveAttribute("aria-selected", "true");
  await expect(tools.getByText("تولد مریم")).toBeVisible();

  const audit = await new AxeBuilder({ page }).include("#tools").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(audit.violations.map(({ id }) => id)).toEqual([]);
});

test("the state's own occasions carry the mark and not the country's name", async ({ page }) => {
  await page.getByRole("region", { name: "تقویم ماهانه" }).getByRole("switch", { name: "دولتی", exact: true }).click();
  await page.getByRole("button", { name: "ماه بعد" }).click();
  for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "ماه بعد" }).click();
  await page.getByRole("button", { name: "۲۲ بهمن ۱۴۰۵", exact: true }).click();
  const selected = page.getByTestId("selected-events");
  await expect(selected).toContainText("شورش ۵۷");
  await expect(selected).not.toContainText("ایران");
  // The glyph, not an emoji: it is an SVG that takes the theme's colour.
  await expect(selected.locator('svg[aria-label="جمهوری اسلامی"]')).toHaveCount(1);
});

test("the hero draws the day as an image, from what is actually on screen", async ({ page }) => {
  const hero = page.getByRole("button", { name: "تصویر امروز" });
  await expect(hero).toBeVisible();

  // Rendered in the browser: no request leaves the page to produce it.
  const requests: string[] = [];
  page.on("request", (request) => { if (!request.url().startsWith("http://localhost") && !request.url().startsWith("http://127.0.0.1")) requests.push(request.url()); });

  // Clicking saves a PNG named for the day, with no share sheet in a desktop browser.
  const download = page.waitForEvent("download", { timeout: 15000 });
  await hero.click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^taghvim-\d{4}-\d{2}-\d{2}\.png$/);
  await expect(page.locator("main").getByRole("status").first()).toContainText("تصویر ذخیره شد");
  expect(requests).toEqual([]);
});

test("every tool says what it answers, in one line", async ({ page }) => {
  const tools = page.locator("#tools");
  const tabs = await page.getByRole("tab").all();
  expect(tabs).toHaveLength(6);
  const seen = new Set<string>();
  for (const tab of tabs) {
    await tab.click();
    const description = (await tools.getByTestId("tool-description").textContent())?.trim() ?? "";
    // Present, a sentence rather than a label, and not the tab's own name repeated back.
    expect(description.length).toBeGreaterThan(20);
    expect(description).not.toBe((await tab.textContent())?.trim());
    seen.add(description);
  }
  expect(seen.size).toBe(6);
});
