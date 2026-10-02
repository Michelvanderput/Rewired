// Automaticity check + graduation, fading reminders, max-3 warning, weekly reflection, calmer feedback
const { test, expect } = require("@playwright/test");
const { skipRecap, watchErrors } = require("../support/helpers");

const SUNDAY = new Date("2026-10-11T19:30:00+02:00");

function seed(page, now, extra) {
  return page.addInitScript(([now, extra]) => {
    if (localStorage.getItem("rewired.v1")) return;
    const D = 864e5, st = now - 40 * D;
    localStorage.setItem("rewired.v1", JSON.stringify(Object.assign({
      onboarded: true, name: "Michel", startDate: st, firstStart: st, celebrated: [1, 3, 7, 14, 30].map(d => d + "@" + st),
      settings: { sound: false, haptics: false, lightWarned: true },
      habits: [
        { id: "p", tpl: "pushups", e: "💪", t: "Push-ups", type: "count", target: 50, unit: "reps", steps: [10], created: now - 20 * D },
        { id: "m", tpl: "meditate", e: "🧘", t: "Mediteren", type: "timer", target: 10, unit: "min", created: now - 3 * D },
        { id: "f", tpl: "floss", e: "🦷", t: "Flossen", type: "check", created: now - 30 * D, srbai: [{ ts: now - 2 * D, score: 4 }] }
      ]
    }, extra)));
  }, [now.getTime(), extra || {}]);
}

test("automaticity check, graduation and fading reminders", async ({ page, context }) => {
  const errors = watchErrors(page);
  await context.clock.install({ time: new Date("2026-10-07T06:00:00+02:00") });
  await seed(page, new Date("2026-10-07T06:00:00+02:00")); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);

  // reminder levels fade with the score
  expect(await page.evaluate(() => ["p", "m", "f"].map(id => Habits.reminderLevel(Habits.get(id)).id))).toEqual(["daily", "daily", "alternate"]);
  // morning nudges for today and tomorrow (push-ups + meditation are morning habits, not done yet)
  const n = await page.evaluate(() => Habits.nudges());
  expect(Object.keys(n.n0)).toEqual(["2026-10-07", "2026-10-08"]);
  expect(n.n0["2026-10-07"].title).toBe("🌅 Ochtend: 2 gewoontes");
  expect(n.n0["2026-10-07"].body).toContain("Push-ups (min. 5 push-ups)");
  // once done today, today's nudge only has the other habit
  await page.evaluate(() => { Habits.setStatus(Habits.get("m"), Store.dayKey(), { s: "min" }); });
  expect((await page.evaluate(() => Habits.nudges())).n0["2026-10-07"].title).toBe("🌅 Ochtend: push-ups");

  // push-ups is 20 days old → the check is due
  await expect(page.locator("[data-auto]")).toContainText("Gaat push-ups al vanzelf?");
  await page.evaluate(() => document.querySelector("[data-auto]").scrollIntoView({ block: "center" }));
  await page.tap("[data-auto]"); await page.waitForTimeout(800);
  await expect(page.locator(".sheet [data-save]")).toBeDisabled();
  for (let q = 0; q < 4; q++) await page.tap(`.sheet [data-q="${q}"] [data-v="${q === 3 ? 5 : 6}"]`);
  await page.tap(".sheet [data-save]");
  await expect(page.locator(".sheet")).toContainText("Score 5,8 / 7");
  await expect(page.locator(".sheet")).toContainText("Klaar om af te studeren?");
  await expect(page.locator(".sheet")).toContainText("Herinneringen: alleen na een gemiste dag");
  await page.tap(".sheet [data-grad]"); await page.waitForTimeout(700);

  const p = await page.evaluate(() => Habits.get("p"));
  expect(p.srbai.at(-1).score).toBe(5.8);
  expect(p.graduated).toBeTruthy();
  expect(await page.evaluate(() => [Habits.active().length, Habits.reminderLevel(Habits.get("p")).id, Habits.autoDue(Habits.get("p"))])).toEqual([2, "off", false]);
  await expect(page.locator('.h-group[data-anchor="auto"]')).toContainText("Automatisch");
  await expect(page.locator("[data-auto]")).toHaveCount(0);

  // back to active from the detail sheet
  await page.tap('[data-habit="p"] .li-body'); await page.waitForTimeout(700);
  await expect(page.locator(".sheet")).toContainText("Gaat vanzelf");
  await page.tap(".sheet [data-ungrad]");
  expect(await page.evaluate(() => !!Habits.get("p").graduated)).toBe(false);
  expect(errors).toEqual([]);
});

test("warning above 3 active habits, calmer completion feedback", async ({ page, context }) => {
  await context.clock.install({ time: new Date("2026-10-07T10:00:00+02:00") });
  await seed(page, new Date("2026-10-07T10:00:00+02:00")); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);
  await page.tap('[data-action="addHabit"]'); await page.waitForTimeout(700);
  await expect(page.locator(".sheet")).toContainText("Je volgt al 3 gewoontes");
  await page.tap('.sheet [data-tpl="water"]');
  await expect(page.locator("#toast")).toContainText("dat zijn er 4, begin klein");
  await page.tap(".sheet-backdrop", { position: { x: 20, y: 20 } }); await page.waitForTimeout(600);

  // finishing a habit gives information, not confetti
  await page.evaluate(() => document.querySelector('[data-habit="f"]').scrollIntoView({ block: "center" }));
  await page.tap('[data-habit="f"] [data-h-act="toggle"]'); await page.waitForTimeout(300);
  await page.tap('[data-habit="p"] .li-body'); await page.waitForTimeout(700);
  await page.fill(".sheet [data-manual]", "50"); await page.tap(".sheet [data-set]"); await page.waitForTimeout(200);
  await expect(page.locator("#toast")).toContainText("Push-ups: 50 reps · gedaan");
  expect(await page.locator(".confetti").count()).toBe(0);
});

test("weekly reflection on Sunday, with last week's intention", async ({ page, context }) => {
  const errors = watchErrors(page);
  await context.clock.install({ time: SUNDAY });
  const lastMonday = "2026-09-28";
  await seed(page, SUNDAY, { reflections: { [lastMonday]: { ts: 1, good: "x", hard: "y", change: "Telefoon om 22:30 in de gang" } },
    urges: [{ ts: SUNDAY.getTime() - 864e5, resisted: true }, { ts: SUNDAY.getTime() - 2 * 864e5, resisted: false }] });
  await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);

  await expect(page.locator('[data-action="reflect"]').first()).toContainText("Weekreflectie");
  await page.tap('.card[data-action="reflect"]'); await page.waitForTimeout(800);
  await expect(page.locator(".sheet")).toContainText("5 okt – 11 okt");
  await expect(page.locator(".sheet")).toContainText("Vorige week nam je je voor");
  await expect(page.locator(".sheet")).toContainText("Telefoon om 22:30 in de gang");
  await expect(page.locator(".sheet")).toContainText("2 drang gelogd · 1 weerstaan");
  await page.fill('.sheet [data-r="good"]', "Elke ochtend push-ups");
  await page.fill('.sheet [data-r="change"]', "Eerder naar bed");
  await page.tap(".sheet [data-save]"); await page.waitForTimeout(700);

  const r = await page.evaluate(() => Store.s.reflections["2026-10-05"]);
  expect(r).toMatchObject({ good: "Elke ochtend push-ups", hard: "", change: "Eerder naar bed" });
  await expect(page.locator('.card[data-action="reflect"]')).toHaveCount(0);
  expect(await page.evaluate(() => Reflect.doneThisWeek())).toBe(true);

  await page.tap('.tab[data-tab="progress"]'); await page.waitForTimeout(900);
  await expect(page.locator(".refl").first()).toContainText("Eerder naar bed");

  // not due mid-week
  await context.clock.setSystemTime(new Date("2026-10-14T19:30:00+02:00"));
  expect(await page.evaluate(() => Reflect.due())).toBeNull();
  expect(errors).toEqual([]);
});
