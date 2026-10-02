// Behaviour design: if-then plans, minimum version / skip with reason, weekly target + never miss twice,
// today grouped by moment, risk moments from the urge log
const { test, expect } = require("@playwright/test");
const { skipRecap, watchErrors } = require("../support/helpers");

const D = 864e5;
const NOW = new Date("2026-10-07T22:10:00+02:00"); // a Wednesday evening

function seed(page, extra) {
  return page.addInitScript(([now, extra]) => {
    if (localStorage.getItem("rewired.v1")) return;
    const D = 864e5, st = now - 20 * D;
    const k = d => { const x = new Date(d); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
    const base = {
      onboarded: true, name: "Michel", startDate: st, firstStart: st, celebrated: [1, 3, 7, 14].map(d => d + "@" + st),
      settings: { sound: false, haptics: false, lightWarned: true },
      habits: [
        { id: "p", tpl: "pushups", e: "💪", t: "Push-ups", type: "count", target: 50, unit: "reps", steps: [10], created: now - 6 * D },
        { id: "r", tpl: "read", e: "📚", t: "Lezen", type: "timer", target: 20, unit: "min", created: now - 6 * D },
        { id: "g", e: "🎸", t: "Gitaar", type: "check", created: now - 10 * D, weekly: 3, plan: { anchor: "afterwork", cue: "Na het eten", where: "In de woonkamer", min: "1 liedje" } },
        { id: "w", tpl: "water", e: "💧", t: "Water drinken", type: "count", target: 2000, unit: "ml", steps: [250], created: now - 6 * D }
      ],
      // push-ups: shown 4, 3 and 2 days ago, missed yesterday → the line is 3 and today matters
      habitVal: { [k(now - 4 * D)]: { p: 50 }, [k(now - 3 * D)]: { p: 50 }, [k(now - 2 * D)]: { p: 60 } },
      habitLog: { [k(now - 4 * D)]: ["p"], [k(now - 3 * D)]: ["p"], [k(now - 2 * D)]: ["p"], [k(now - 2 * D) ]: ["p", "g"], [k(now - D)]: ["g"] },
      urges: []
    };
    // 12 urges, mostly between 22:00 and 24:00 in the bedroom while tired
    for (let i = 0; i < 12; i++) {
      const d = new Date(now - (i + 1) * D); d.setHours(i < 9 ? 22 + (i % 2) : 15, 20, 0, 0);
      base.urges.push({ ts: d.getTime(), intensity: 6, trigger: "Laat op bed", resisted: i % 3 !== 0, place: i < 9 ? "Slaapkamer" : "Bureau", feeling: i < 9 ? "Moe" : "Gestrest" });
    }
    localStorage.setItem("rewired.v1", JSON.stringify(Object.assign(base, extra)));
  }, [NOW.getTime(), extra || {}]);
}

test.beforeEach(async ({ context }) => { await context.clock.install({ time: NOW }); });

test("plans, minimum version, skip, weekly target, grouping", async ({ page }) => {
  const errors = watchErrors(page);
  await seed(page); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);

  // grouped by moment, the evening group is marked "nu"
  const groups = await page.$$eval(".h-group", els => els.map(e => e.dataset.anchor));
  expect(groups).toEqual(["morning", "afterwork", "evening", "any"]);
  await expect(page.locator('.h-group[data-anchor="evening"]')).toContainText("nu");

  // never miss twice
  expect(await page.evaluate(() => [Habits.streak(Habits.get("p")), Habits.atRisk(Habits.get("p"))])).toEqual([3, true]);
  await expect(page.locator('[data-habit="p"] .li-sub')).toContainText("Gisteren gemist · minimaal 5 push-ups");

  // weekly target: 3× per week, done Mon + Tue
  await expect(page.locator('[data-habit="g"] .li-sub')).toContainText("2/3 deze week");

  // minimum version counts as showing up
  await page.tap('[data-habit="p"] .li-body'); await page.waitForTimeout(700);
  await page.tap('.sheet [data-st="min"]');
  expect(await page.evaluate(() => [Habits.shown(Habits.get("p")), Habits.isDone(Habits.get("p")), Habits.streak(Habits.get("p"))])).toEqual([true, false, 4]);
  await expect(page.locator(".sheet")).toContainText("Telt als komen opdagen (5 push-ups)");
  // recap: the minimum version is "good", a skipped day of a 3×-per-week habit is not a miss
  await page.evaluate(() => Habits.setStatus(Habits.get("g"), Store.dayKey(), { s: "skip", why: "Geen tijd" }));
  const rc = await page.evaluate(() => Recap.compute(Store.dayKey()));
  expect(rc.good.map(x => x.t)).toEqual(expect.arrayContaining(["Push-ups: minimale versie (5 push-ups)", "Gitaar: rustdag (3× per week)"]));
  expect(rc.bad.map(x => x.t).join()).not.toMatch(/Gitaar|Push-ups/);
  expect(rc.stats.hTot).toBe(3);
  await expect(page.locator(".sheet")).toContainText("Maak een als-dan-plan");

  // write the plan from the detail sheet
  await page.tap(".sheet .card[data-edit]"); await page.waitForTimeout(900);
  await page.fill(".sheet [data-cue]", "Na het tandenpoetsen");
  await page.fill(".sheet [data-where]", "Naast mijn bed");
  await page.tap('.sheet [data-anchor-seg] [data-v="evening"]');
  await page.tap('.sheet [data-weekly] [data-v="5"]');
  await page.tap(".sheet [data-save]"); await page.waitForTimeout(700);
  const p = await page.evaluate(() => Habits.get("p"));
  expect(p.plan).toEqual({ anchor: "evening", cue: "Na het tandenpoetsen", where: "Naast mijn bed", min: "5 push-ups" });
  expect(p.weekly).toBe(5);
  await page.tap('[data-habit="p"] .li-body'); await page.waitForTimeout(700);
  await expect(page.locator(".sheet")).toContainText("Na het tandenpoetsen, naast mijn bed: push-ups");
  await expect(page.locator(".sheet")).toContainText("5× per week");
  await page.tap(".sheet-backdrop", { position: { x: 20, y: 20 } }); await page.waitForTimeout(600);

  // skip with a reason; reaching the goal afterwards clears it
  await page.tap('[data-habit="r"] .li-body'); await page.waitForTimeout(700);
  await page.tap('.sheet [data-st="skip"]');
  await page.tap('.sheet [data-why] [data-v="Moe of ziek"]');
  expect(await page.evaluate(() => Habits.status(Habits.get("r")))).toEqual({ s: "skip", why: "Moe of ziek" });
  await page.tap(".sheet-backdrop", { position: { x: 20, y: 20 } }); await page.waitForTimeout(600);
  await expect(page.locator('[data-habit="r"] .li-sub')).toContainText("Overgeslagen · Moe of ziek");
  await page.tap('[data-habit="r"] .li-body'); await page.waitForTimeout(700);
  await page.tap('.sheet [data-add="20"]'); await page.waitForTimeout(300);
  expect(await page.evaluate(() => [Habits.isDone(Habits.get("r")), Habits.status(Habits.get("r"))])).toEqual([true, null]);
  await page.tap(".sheet-backdrop", { position: { x: 20, y: 20 } }); await page.waitForTimeout(600);
  await expect(page.locator('[data-habit="r"] .li-sub')).not.toContainText("Overgeslagen");

  expect(errors).toEqual([]);
});

test("risk moments: analysis, home warning, push reminders, urge log", async ({ page }) => {
  const errors = watchErrors(page);
  await seed(page); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);

  const m = await page.evaluate(() => Risk.moments());
  expect(m[0]).toMatchObject({ label: "22:00–00:00", count: 9, place: "Slaapkamer", feeling: "Moe" });
  expect(m[1]).toMatchObject({ label: "15:00–17:00", place: "Bureau", feeling: "Gestrest" });

  // it is 22:10: the warning card is on home
  await expect(page.locator(".risk-card")).toContainText("Jouw risicomoment · 22:00–00:00");
  await expect(page.locator(".risk-card")).toContainText("meestal slaapkamer · moe");

  // reminders for the push server, 15 minutes before each window
  const r = await page.evaluate(() => Risk.pushReminders());
  expect(r.reminders).toEqual({ risk0: { on: true, time: "21:45" }, risk1: { on: true, time: "14:45" } });
  expect(r.risks[0].tip).toMatch(/eerder slapen/);

  await page.tap('.tab[data-tab="progress"]'); await page.waitForTimeout(800);
  await expect(page.locator("[data-risk]")).toContainText("22:00–00:00");
  await expect(page.locator("[data-risk]")).toContainText("9× in 60 dagen");

  // the urge log asks for place and feeling
  await page.tap('.tab[data-tab="home"]'); await page.waitForTimeout(600);
  await page.tap('[data-action="urge"]'); await page.waitForTimeout(700);
  await page.tap('.sheet [data-chips="place"] [data-v="Badkamer"]');
  await page.tap('.sheet [data-chips="feel"] [data-v="Eenzaam"]');
  await page.tap(".sheet [data-save]"); await page.waitForTimeout(700);
  expect(await page.evaluate(() => Store.s.urges.at(-1))).toMatchObject({ place: "Badkamer", feeling: "Eenzaam", resisted: true });
  expect(errors).toEqual([]);
});

test("fewer than 10 logs: shows how many are still needed", async ({ page }) => {
  await seed(page, { urges: [{ ts: NOW.getTime() - D, resisted: true }] }); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1200);
  expect(await page.evaluate(() => Risk.moments())).toEqual([]);
  await expect(page.locator(".risk-card")).toHaveCount(0);
  await page.tap('.tab[data-tab="progress"]'); await page.waitForTimeout(800);
  await expect(page.locator("[data-risk]")).toContainText("Nog 9 logs");
});
