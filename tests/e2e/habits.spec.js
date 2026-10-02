// Habit types, migration of old habits, smart links with the Dopamine Reset
const { test, expect } = require("@playwright/test");
const { skipRecap, watchErrors } = require("../support/helpers");

test("habits: migration, count, timer, limit, time, check", async ({ page }) => {
  const errors = watchErrors(page);
  await skipRecap(page);
  await page.addInitScript(() => {
    if (localStorage.getItem("rewired.v1")) return;
    const D = 864e5, st = Date.now() - 12 * D;
    const k = d => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
    localStorage.setItem("rewired.v1", JSON.stringify({ onboarded: true, name: "Michel", startDate: st, firstStart: st, celebrated: [1, 3, 7].map(d => d + "@" + st),
      habits: [{ id: "h1", e: "💪", t: "Push-ups" }, { id: "h2", e: "💧", t: "2L water" }, { id: "h3", e: "🙏", t: "Dankbaarheid" }, { id: "h9", e: "🎸", t: "Gitaar" }],
      habitLog: { [k(Date.now())]: ["h1"], [k(Date.now() - D)]: ["h1", "h9"] } }));
  });
  await page.goto("/"); await page.waitForTimeout(2000);

  const s = await page.evaluate(() => Store.s);
  expect(s.habits.find(h => h.id === "h1")).toMatchObject({ type: "count", target: 50 });
  expect(s.habits.find(h => h.id === "h2")).toMatchObject({ type: "count", unit: "ml" });
  expect(s.habits.find(h => h.id === "h9").type).toBe("check");
  expect(await page.evaluate(() => Habits.streak(Habits.get("h1")))).toBe(2);

  await page.evaluate(() => document.querySelector('[data-habit="h2"]').scrollIntoView({ block: "center" }));
  for (let i = 0; i < 3; i++) { await page.tap('[data-habit="h2"] [data-h-act="add"]'); await page.waitForTimeout(120); }
  await expect(page.locator('[data-habit="h2"] .li-sub')).toContainText("0,75 / 2 L");

  await page.tap('[data-habit="h2"] .li-body'); await page.waitForTimeout(700);
  for (let i = 0; i < 3; i++) { await page.tap('.sheet [data-add="500"]'); await page.waitForTimeout(120); }
  expect(await page.evaluate(() => Habits.isDone(Habits.get("h2")))).toBe(true);
  await page.fill(".sheet [data-manual]", "1500"); await page.tap(".sheet [data-set]"); await page.waitForTimeout(200);
  expect(await page.evaluate(() => Store.s.habitVal[Store.dayKey()].h2)).toBe(1500);
  await page.tap(".sheet-backdrop", { position: { x: 10, y: 10 } }); await page.waitForTimeout(600);

  await page.tap('[data-action="addHabit"]'); await page.waitForTimeout(700);
  for (const t of ["meditate", "screen", "wake", "cold", "bed"]) { await page.tap(`.sheet [data-tpl="${t}"]`); await page.waitForTimeout(120); }
  await page.tap(".sheet-backdrop", { position: { x: 10, y: 10 } }); await page.waitForTimeout(700);
  const id = t => page.evaluate(t => Store.s.habits.find(h => h.tpl === t).id, t);

  const med = await id("meditate");
  await page.evaluate(i => document.querySelector(`[data-habit="${i}"]`).scrollIntoView({ block: "center" }), med);
  await page.tap(`[data-habit="${med}"] [data-h-act="timer"]`); await page.waitForTimeout(300);
  await page.evaluate(i => { Store.s.habitTimer[i].start -= 12 * 60000; }, med); await page.waitForTimeout(1200);
  await expect(page.locator(`[data-habit="${med}"] .li-sub`)).toContainText("12 / 10 min");
  await page.tap(`[data-habit="${med}"] [data-h-act="timer"]`); await page.waitForTimeout(300);
  expect(await page.evaluate(i => Math.floor(Store.s.habitVal[Store.dayKey()][i]), med)).toBe(12);
  expect(await page.evaluate(() => Store.s.reset[Store.dayKey()].includes("meditate"))).toBe(true);

  const scr = await id("screen");
  for (let i = 0; i < 9; i++) { await page.tap(`[data-habit="${scr}"] [data-h-act="add"]`); await page.waitForTimeout(60); }
  await expect(page.locator(`[data-habit="${scr}"] .li-sub`)).toContainText("over limiet");

  await page.tap(`[data-habit="${await id("wake")}"] [data-h-act="now"]`); await page.waitForTimeout(200);
  expect(await page.evaluate(() => {
    const H = Habits.get(Store.s.habits.find(h => h.tpl === "bed").id), k = Store.dayKey();
    Store.s.habitVal[k][H.id] = 30; const late = Habits.isDone(H);
    Store.s.habitVal[k][H.id] = 22 * 60 + 45; return !late && Habits.isDone(H);
  }), "bedtime: 00:30 late, 22:45 on time").toBe(true);

  await page.tap(`[data-habit="${await id("cold")}"] [data-h-act="toggle"]`); await page.waitForTimeout(200);
  expect(await page.evaluate(() => Store.s.reset[Store.dayKey()].includes("cold"))).toBe(true);

  await page.evaluate(() => Habits.editHabit("h2")); await page.waitForTimeout(700);
  await page.fill(".sheet [data-target]", "2500"); await page.tap(".sheet [data-save]"); await page.waitForTimeout(600);
  expect(await page.evaluate(() => Habits.get("h2").target)).toBe(2500);

  await page.tap('.tab[data-tab="progress"]'); await page.waitForTimeout(1200);
  await expect(page.locator(".h-week")).toHaveCount(9);
  expect(errors).toEqual([]);
});
