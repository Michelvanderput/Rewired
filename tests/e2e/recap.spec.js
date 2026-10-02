// Morning recap and midnight reset, driven by a fake clock
const { test, expect } = require("@playwright/test");
const { watchErrors } = require("../support/helpers");

test.use({ timezoneId: "America/Curacao" });

test("recap of yesterday, midnight rollover and timer split", async ({ page, context }) => {
  const errors = watchErrors(page);
  await context.clock.install({ time: new Date("2026-09-29T08:05:00-04:00") });
  await page.addInitScript(() => {
    if (localStorage.getItem("rewired.v1")) return;
    const Y = "2026-09-28", created = Date.parse("2026-09-01T10:00:00-04:00"), st = Date.parse("2026-09-20T09:00:00-04:00");
    localStorage.setItem("rewired.v1", JSON.stringify({
      onboarded: true, name: "Michel", startDate: st, firstStart: Date.parse("2026-09-01T09:00:00-04:00"), celebrated: [1, 3, 7].map(d => d + "@" + st), recapSeen: "2026-09-28",
      habits: [
        { id: "w", tpl: "water", e: "💧", t: "Water drinken", type: "count", target: 2000, unit: "ml", steps: [250, 500], created },
        { id: "p", tpl: "pushups", e: "💪", t: "Push-ups", type: "count", target: 50, unit: "reps", steps: [10, 5], created },
        { id: "s", tpl: "screen", e: "📱", t: "Schermtijd", type: "limit", target: 120, unit: "min", steps: [15, 30], created },
        { id: "m", tpl: "meditate", e: "🧘", t: "Mediteren", type: "timer", target: 10, unit: "min", created }
      ],
      habitVal: { [Y]: { w: 1200, p: 60, s: 180, m: 12 } }, habitLog: { [Y]: ["p", "m"] }, reset: { [Y]: ["cold", "sun", "meditate"] },
      urges: [{ ts: Date.parse("2026-09-28T21:10:00-04:00"), intensity: 7, trigger: "Verveling", resisted: true }],
      checkins: { [Y]: { mood: "🙂", energy: 7 } }, journal: [], relapses: []
    }));
  });
  await page.goto("/"); await context.clock.runFor(6500);

  const fs = page.locator(".fs");
  await expect(page.locator(".rc-score")).toBeVisible();
  await expect(fs).toContainText("maandag 28 september");
  await expect(fs).toContainText("Push-ups: 60 reps");
  await expect(fs).toContainText("Water drinken: 1,2 L van 2 L (60%)");
  await expect(fs).toContainText("Schermtijd: 180 min, dat is 60 min boven je limiet");
  await expect(fs).toContainText("Dopamine Reset: 3/8");
  await expect(fs).toContainText("Clean dag");
  await expect(fs).toContainText("fles naast je bed");
  await expect(fs).toContainText("schermtijd onder de 120 min houden");
  const score = await page.evaluate(() => Recap.compute("2026-09-28").score);
  await expect(page.locator("[data-num]")).toHaveText(String(score));
  await page.tap(".fs .btn[data-close]"); await context.clock.runFor(800);

  await page.reload(); await context.clock.runFor(4000);
  await expect(page.locator(".rc-score")).toHaveCount(0);
  const sum = await page.evaluate(() => Recap.summary("2026-09-28"));
  expect(sum.title).toBe(`Recap: ${score}% · 2/4 gewoontes`);
  expect(JSON.stringify(sum)).not.toMatch(/Verveling/);

  // midnight
  await page.evaluate(() => { Store.s.habitVal[Store.dayKey()] = { w: 500 }; Store.s.reset[Store.dayKey()] = ["cold"]; Store.save(); });
  await context.clock.setSystemTime(new Date("2026-09-29T23:50:00-04:00"));
  await page.evaluate(() => { Store.s.habitTimer.m = { start: Date.now(), day: Store.dayKey() }; Store.save(); App.refresh(false); });
  await context.clock.runFor(2000);
  await context.clock.fastForward(11 * 60 * 1000); await context.clock.runFor(2000);
  const mid = await page.evaluate(() => ({ key: Store.dayKey(), old: Store.s.habitVal["2026-09-29"].m, t: Store.s.habitTimer.m, h: Store.s.habitTimer.m && new Date(Store.s.habitTimer.m.start).getHours() }));
  expect(mid.key).toBe("2026-09-30");
  expect(Math.round(mid.old)).toBe(10);
  expect(mid.t.day).toBe("2026-09-30");
  expect(mid.h).toBe(0);
  await expect(page.locator('[data-habit="w"] .li-sub')).toContainText("0 / 2 L");
  await expect(page.locator("[data-reset-count]")).toHaveText("0/8");
  await expect(page.locator(".rc-score")).toHaveCount(0); // not before 04:00

  await context.clock.fastForward(4 * 3600 * 1000); await context.clock.runFor(1500);
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); await context.clock.runFor(2500);
  await expect(page.locator(".fs")).toContainText("dinsdag 29 september");
  expect(errors).toEqual([]);
});
