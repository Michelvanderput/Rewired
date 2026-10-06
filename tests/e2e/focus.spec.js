// Focus (porn / gambling / ADHD): only what you chose shows up, so the app stays calm for everyone else
const { test, expect } = require("@playwright/test");
const { seed, skipRecap, watchErrors, closeAllOverlays } = require("../support/helpers");

test("without a focus nothing extra appears", async ({ page }) => {
  await seed(page); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);
  await expect(page.locator(".fp-card")).toHaveCount(0);
  await expect(page.locator(".fp-money")).toHaveCount(0);
  expect(await page.evaluate(() => [Learn.all().length, Learn.paths().length, Focus.triggers().includes("Verlies terugwinnen")])).toEqual([54, 7, false]);
  await page.tap('.tab[data-tab="tools"]'); await page.waitForTimeout(700);
  await expect(page.locator('[data-action="dopa"]')).toHaveCount(0);
  await page.tap('.tab[data-tab="profile"]'); await page.waitForTimeout(700);
  await expect(page.locator('[data-action="focus"]')).toContainText("Nog niets gekozen");
});

test("choose gambling + porn: lessons, triggers, starter plan, money, help", async ({ page }) => {
  const errors = watchErrors(page);
  await seed(page, {}, { daysClean: 14 }); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1000); await closeAllOverlays(page); // 2-week milestone
  await page.tap('.tab[data-tab="profile"]'); await page.waitForTimeout(700);
  await page.tap('[data-action="focus"]'); await page.waitForTimeout(700);
  await page.tap('.sheet [data-topics] [data-v="gambling"]'); await page.tap('.sheet [data-topics] [data-v="porn"]');
  await page.fill(".sheet [data-money]", "70");
  await page.tap(".sheet [data-save]"); await page.waitForTimeout(800);
  await expect(page.locator('[data-action="focus"]')).toContainText("💶 Gokken");

  // help: topic-specific first, general after
  await page.tap('[data-action="help"]'); await page.waitForTimeout(700);
  const help = await page.locator(".sheet .li-title").allTextContents();
  expect(help).toEqual(expect.arrayContaining(["OpenOverGokken", "Gokstop via Cruks", "Jellinek", "Je huisarts", "113 Zelfmoordpreventie"]));
  expect(await page.locator('.sheet a[href="https://cruksregister.nl"]').count()).toBe(1);
  await page.tap(".sheet-backdrop", { position: { x: 20, y: 20 } }); await page.waitForTimeout(600);

  // home: money counter (14 days × €70/week = €140) and a starter plan with at most 2 open steps
  await page.tap('.tab[data-tab="home"]'); await page.waitForTimeout(900);
  await expect(page.locator(".fp-money")).toContainText("€ 140 niet vergokt");
  await expect(page.locator(".fp-card .eyebrow")).toContainText("Je startplan · 1/6"); // money step counts as done
  expect(await page.locator(".fp-card .fp-step").count()).toBe(2);
  await page.tap('.fp-card [data-fp-done="apps"]'); await page.waitForTimeout(800);
  await expect(page.locator(".fp-card .eyebrow")).toContainText("2/6");
  await page.tap(".fp-card [data-fp-hide]"); await page.waitForTimeout(700);
  await expect(page.locator(".fp-card")).toHaveCount(0);

  // learn: the two focus paths come first, their lessons are in the list
  await page.tap('.tab[data-tab="learn"]'); await page.waitForTimeout(900);
  expect((await page.locator(".ln-path b").allTextContents()).slice(0, 2)).toEqual(["Vrij van porno", "Grip op gokken"]);
  expect(await page.evaluate(() => Learn.all().length)).toBe(62);
  await page.tap('[data-ln-filter="Gokken"]'); await page.waitForTimeout(400);
  expect(await page.locator("[data-ln-list] .ln-item").count()).toBe(4);

  // urge log offers the gambling triggers
  await page.tap('.tab[data-tab="home"]'); await page.waitForTimeout(700);
  await page.tap('[data-action="urge"]'); await page.waitForTimeout(700);
  await expect(page.locator('.sheet [data-chips="trig"]')).toContainText("Verlies terugwinnen");
  await expect(page.locator('.sheet [data-chips="trig"]')).toContainText("Telefoon in bed");
  expect(errors).toEqual([]);
});

test("ADHD: dopamine menu, short routines, habit warning from 2", async ({ page, context }) => {
  const errors = watchErrors(page);
  await context.clock.install({ time: new Date("2026-10-07T07:15:00+02:00") });
  await seed(page, { focus: ["adhd"] }); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);

  await page.tap('.tab[data-tab="tools"]'); await page.waitForTimeout(700);
  await page.tap('[data-action="dopa"]'); await page.waitForTimeout(800);
  await page.tap(".sheet [data-pick]");
  const picked = await page.locator(".sheet .fp-pick").textContent();
  const quick = await page.evaluate(() => Store.s.dopaMenu.filter(x => x.k === "quick").map(x => x.t));
  expect(quick.some(q => picked.startsWith(q))).toBe(true);
  await page.tap('.sheet [data-k] [data-v="main"]');
  await page.fill(".sheet [data-t]", "Rondje fietsen"); await page.tap(".sheet [data-add]");
  expect(await page.evaluate(() => Store.s.dopaMenu.at(-1))).toMatchObject({ k: "main", t: "Rondje fietsen" });
  await page.tap(".sheet-backdrop", { position: { x: 20, y: 20 } }); await page.waitForTimeout(600);

  // routines start short
  await page.evaluate(() => Routine.start("morning")); await page.waitForTimeout(900);
  await expect(page.locator('.fs [data-short] [data-v="1"]')).toHaveClass(/on/);
  await page.tap(".fs .rt-top [data-close]"); await page.waitForTimeout(700);

  // habit warning already at 2 active habits (the seed has 3)
  await page.evaluate(() => Habits.addSheet()); await page.waitForTimeout(700);
  await expect(page.locator(".sheet")).toContainText("1 of 2 (zeker met ADHD)");
  expect(errors).toEqual([]);
});
