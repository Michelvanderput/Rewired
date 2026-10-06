// Morning and evening routine: guided flow, linked habits and Dopamine Reset, plan carried to the next morning,
// short version, editor, recap and push reminders that skip when the routine is done
const { test, expect } = require("@playwright/test");
const { skipRecap, watchErrors } = require("../support/helpers");

function seed(page, now) {
  return page.addInitScript(now => {
    if (localStorage.getItem("rewired.v1")) return;
    const D = 864e5, st = now - 20 * D;
    localStorage.setItem("rewired.v1", JSON.stringify({
      onboarded: true, name: "Michel", startDate: st, firstStart: st, celebrated: [1, 3, 7, 14].map(d => d + "@" + st),
      settings: { sound: false, haptics: false, lightWarned: true },
      habits: [
        { id: "w", tpl: "water", e: "💧", t: "Water drinken", type: "count", target: 2000, unit: "ml", steps: [250], created: now - 5 * D },
        { id: "c", tpl: "cold", e: "🧊", t: "Koude douche", type: "check", created: now - 5 * D },
        { id: "b", tpl: "bedroom", e: "📵", t: "Telefoon uit de slaapkamer", type: "check", created: now - 5 * D }
      ]
    }));
  }, now.getTime());
}
const done = page => page.tap(".fs [data-done]");
const skip = page => page.tap(".fs [data-skip]");
const title = page => page.locator(".fs .rt-title");

test("evening routine, then the morning picks up the plan", async ({ page, context }) => {
  const errors = watchErrors(page);
  const EVENING = new Date("2026-10-06T22:05:00+02:00");
  await context.clock.install({ time: EVENING });
  await seed(page, EVENING); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);

  await expect(page.locator('[data-routine="evening"]')).toContainText("Avondroutine");
  await expect(page.locator('[data-routine="evening"]')).toContainText("8 stappen");
  await page.tap('[data-routine="evening"]'); await page.waitForTimeout(800);
  await expect(page.locator(".fs")).toContainText("Tijd om af te sluiten, Michel");
  await page.tap(".fs [data-go]"); await page.waitForTimeout(700);

  await expect(title(page)).toHaveText("Klaarzetten voor morgen");
  await expect(page.locator(".fs [data-left]")).toHaveText("5:00");
  await skip(page); await page.waitForTimeout(700);
  // mood = the day's check-in
  await expect(title(page)).toHaveText("Hoe was je dag?");
  await expect(page.locator(".fs [data-done]")).toBeDisabled();
  await page.tap('.fs [data-moods] [data-v="🙂"]');
  await done(page); await page.waitForTimeout(700);
  expect(await page.evaluate(() => Store.s.checkins[Store.dayKey()].mood)).toBe("🙂");
  await done(page); await page.waitForTimeout(700); // gratitude
  await expect(title(page)).toHaveText("Plan voor morgen");
  await page.fill(".fs [data-text]", "1. Sporten 2. Rapport af 3. Mama bellen");
  await done(page); await page.waitForTimeout(700);
  await expect(title(page)).toHaveText("Telefoon buiten de slaapkamer");
  await done(page); await page.waitForTimeout(700);
  for (let k = 0; k < 3; k++) { await done(page); await page.waitForTimeout(700); } // read, breath, lights
  await expect(title(page)).toHaveText("Dag afgesloten");
  await expect(page.locator(".fs")).toContainText("7/8 stappen");
  await expect(page.locator(".fs")).toContainText("1. Sporten 2. Rapport af 3. Mama bellen");

  const s = await page.evaluate(() => ({ log: Store.s.routineLog[Store.dayKey()].evening, reset: Store.s.reset[Store.dayKey()], b: Habits.isDone(Habits.get("b")), done: Routine.doneDays() }));
  expect(s.log.skipped).toEqual(["e_tidy"]);
  expect(s.log.end).toBeTruthy();
  expect(s.reset).toEqual(expect.arrayContaining(["journal", "sleep"]));
  expect(s.b).toBe(true);
  expect(s.done).toEqual({ revening: "2026-10-06" });
  await page.tap(".fs .rt-actions [data-close]"); await page.waitForTimeout(800);
  await expect(page.locator('[data-routine="evening"]')).toHaveCount(0);

  // next morning
  await context.clock.setSystemTime(new Date("2026-10-07T07:10:00+02:00"));
  await page.reload(); await page.waitForTimeout(1500);
  await expect(page.locator('[data-routine="morning"]')).toContainText("Ochtendroutine");
  await page.tap('[data-routine="morning"]'); await page.waitForTimeout(800);
  await expect(page.locator(".fs .rt-note")).toContainText("1. Sporten 2. Rapport af 3. Mama bellen");

  // short version: only the core steps
  await page.tap('.fs [data-short] [data-v="1"]'); await page.waitForTimeout(500);
  await expect(page.locator(".fs [data-go]")).toContainText("Start");
  await page.tap(".fs [data-go]"); await page.waitForTimeout(700);
  const seen = [];
  for (let k = 0; k < 5; k++) {
    seen.push(await title(page).textContent());
    if (await page.locator(".fs [data-text]").count()) await page.fill(".fs [data-text]", "Rapport afmaken");
    await done(page); await page.waitForTimeout(700);
  }
  expect(seen).toEqual(["Direct opstaan", "Glas water", "Koud afsluiten", "Focus voor vandaag", "Eerste uur geen social media"]);
  await expect(title(page)).toHaveText("Je dag is gestart");
  const m = await page.evaluate(() => ({ water: Habits.val(Habits.get("w")), cold: Habits.isDone(Habits.get("c")), reset: Store.s.reset[Store.dayKey()], text: Store.s.routineLog[Store.dayKey()].morning.text }));
  expect(m).toEqual({ water: 250, cold: true, reset: expect.arrayContaining(["cold", "nophone"]), text: "Rapport afmaken" });

  // recap of yesterday mentions the routines
  const rc = await page.evaluate(() => Recap.compute("2026-10-06"));
  expect(rc.good.map(x => x.t)).toContain("Avondroutine: 7/8 stappen");
  expect(rc.bad.map(x => x.t)).toContain("Ochtendroutine niet gedaan");
  expect(errors).toEqual([]);
});

test("timer, editor and custom steps", async ({ page, context }) => {
  const errors = watchErrors(page);
  const MORNING = new Date("2026-10-07T07:00:00+02:00");
  await context.clock.install({ time: MORNING });
  await seed(page, MORNING); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);

  await page.tap('.tab[data-tab="tools"]'); await page.waitForTimeout(800);
  await page.tap('[data-action="routines"]'); await page.waitForTimeout(800);
  await expect(page.locator(".sheet")).toContainText("om 07:00");
  await page.tap('.sheet [data-edit="morning"]'); await page.waitForTimeout(900);
  // switch off "Bed opmaken", move "Daglicht" up, mark it as core, add a custom step, change the time
  await page.tap('.sheet [data-k="2"] [data-on]');
  await page.tap('.sheet [data-k="3"] [data-up]');
  await page.tap('.sheet [data-k="2"] [data-core]');
  await page.fill(".sheet [data-nt]", "Vitamines nemen"); await page.fill(".sheet [data-nm]", "1");
  await page.tap(".sheet [data-add]");
  await page.fill(".sheet [data-time]", "06:45"); await page.dispatchEvent(".sheet [data-time]", "change");
  const cfg = await page.evaluate(() => ({ ids: Store.s.routines.morning.steps.map(s => s.id + (s.on ? "" : "-off") + (s.core ? "*" : "")), t: Push.prefs().reminders.rmorning.time }));
  expect(cfg.ids.slice(0, 4)).toEqual(["m_up*", "m_water*", "m_light*", "m_bed-off"]);
  expect(cfg.ids.at(-1)).toMatch(/^c\d+$/);
  expect(cfg.t).toBe("06:45");
  await page.tap(".sheet-backdrop", { position: { x: 20, y: 20 } }); await page.waitForTimeout(600);

  // timer step counts down and rings
  await page.evaluate(() => Routine.start("morning")); await page.waitForTimeout(800);
  await page.tap(".fs [data-go]"); await page.waitForTimeout(700);
  await done(page); await page.waitForTimeout(700); await done(page); await page.waitForTimeout(700);
  await expect(title(page)).toHaveText("Daglicht");
  await page.tap(".fs [data-tgo]");
  await context.clock.fastForward(61000); await context.clock.runFor(500);
  await expect(page.locator(".fs [data-left]")).toHaveText(/^(4:0\d|3:5\d)$/);
  await context.clock.fastForward(240000); await context.clock.runFor(500);
  await expect(page.locator(".fs [data-tgo]")).toHaveText("Tijd is om ✓");
  await done(page); await page.waitForTimeout(700);
  expect(await page.evaluate(() => Store.s.reset[Store.dayKey()])).toContain("sun");
  expect(errors).toEqual([]);
});
