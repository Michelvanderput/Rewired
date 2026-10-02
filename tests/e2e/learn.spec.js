// Learn tab: paths, quiz, bookmarks, search, reading minutes
const { test, expect } = require("@playwright/test");
const { seed, skipRecap, watchErrors } = require("../support/helpers");

test("learn: paths, quiz, bookmarks, filters, reading minutes", async ({ page }) => {
  const errors = watchErrors(page);
  await skipRecap(page);
  await seed(page, { lessonsDone: ["l1", "l3"], habits: [{ id: "hl", tpl: "learn", e: "🧠", t: "Iets nieuws leren", type: "timer", target: 15, unit: "min", created: 1 }] }, { daysClean: 5 });
  await page.goto("/"); await page.waitForTimeout(1500);
  await page.tap('.tab[data-tab="learn"]'); await page.waitForTimeout(1200);

  await expect(page.locator(".ln-stat")).toContainText("2/54");
  await expect(page.locator(".ln-path")).toHaveCount(7);
  await expect(page.locator(".ln-item")).toHaveCount(54);
  const before = await page.textContent("[data-boost-text]");
  await page.tap("[data-boost]"); await page.waitForTimeout(700);
  expect(await page.textContent("[data-boost-text]")).not.toBe(before);

  await page.tap('[data-ln-filter="Lichaam"]'); await page.waitForTimeout(400);
  await expect(page.locator(".ln-item")).toHaveCount(5);
  await page.tap('[data-ln-filter="all"]'); await page.fill("[data-ln-search]", "slaap"); await page.waitForTimeout(300);
  expect(await page.locator(".ln-item").count()).toBeGreaterThanOrEqual(3);
  await page.fill("[data-ln-search]", "");

  await page.tap('[data-path="urges"]'); await page.waitForTimeout(700);
  await expect(page.locator(".sheet")).toContainText("1/7 gelezen");
  await page.tap(".sheet [data-next]"); await page.waitForTimeout(900);
  await expect(page.locator(".sheet h2")).toContainText("De 10-minutenregel");
  await page.tap('.sheet [data-a="1"]'); await page.waitForTimeout(500);
  await expect(page.locator(".sheet [data-why]")).toContainText("Goed!");
  await expect(page.locator(".sheet [data-done]")).toContainText("Gelezen");
  await page.tap(".sheet [data-save]");
  await page.tap(".sheet [data-next]"); await page.waitForTimeout(900);
  await expect(page.locator(".sheet h2")).toContainText("Als-dan-plannen");
  await page.tap('.sheet [data-a="0"]'); await page.waitForTimeout(400);
  await expect(page.locator(".sheet [data-why]")).toContainText("❌");
  await page.tap(".sheet [data-done]"); await page.waitForTimeout(800);
  for (const id of ["sci-want", "sci-pfc", "l2"]) {
    await page.tap(`[data-lesson="${id}"]`); await page.waitForTimeout(700);
    await page.tap(".sheet [data-done]"); await page.waitForTimeout(700);
  }
  const st = await page.evaluate(() => ({ log: Store.s.learnLog[Store.dayKey()], hv: Store.s.habitVal[Store.dayKey()].hl, reset: Store.s.reset[Store.dayKey()].includes("read"), saved: Store.s.lessonSaved }));
  expect(st).toEqual({ log: 15, hv: 15, reset: true, saved: ["l5"] });
  await page.tap('[data-ln-filter="saved"]'); await page.waitForTimeout(400);
  await expect(page.locator(".ln-item")).toHaveCount(1);
  expect(errors).toEqual([]);
});
