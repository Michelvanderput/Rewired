// Rewards, recovery day and app-open tracking (iOS Shortcuts)
const { test, expect } = require("@playwright/test");
const { watchErrors } = require("../support/helpers");

test("rewards unlock and lock again after a relapse; recovery day", async ({ page, context }) => {
  const errors = watchErrors(page);
  await context.clock.install({ time: new Date("2026-09-29T10:00:00+02:00") });
  await page.addInitScript(() => {
    if (localStorage.getItem("rewired.v1")) return;
    const st = Date.parse("2026-09-21T09:00:00+02:00");
    localStorage.setItem("rewired.v1", JSON.stringify({ onboarded: true, name: "Michel", startDate: st, firstStart: st, celebrated: [1, 3, 7].map(d => d + "@" + st), recapSeen: "2026-09-29", settings: { sound: true, haptics: true, lightWarned: true } }));
  });
  await page.goto("/"); await context.clock.runFor(3000);
  const tick = ms => context.clock.runFor(ms);

  await page.tap('.tab[data-tab="tools"]'); await tick(1200);
  await page.tap('[data-action="rewards"]'); await tick(800);
  for (const i of [0, 1, 2]) { await page.tap(`.sheet [data-p="${i}"]`); await tick(200); }
  await expect(page.locator(".sheet .rw-item")).toHaveCount(3);
  await expect(page.locator(".sheet [data-claim]")).toHaveCount(2);
  await page.tap(".sheet-backdrop", { position: { x: 10, y: 10 } }); await tick(700);
  await page.tap('.tab[data-tab="home"]'); await tick(2500);
  await expect(page.locator(".fs .rw-big")).toBeVisible();
  await page.tap(".fs [data-claim]"); await tick(2400);
  if (await page.locator(".fs [data-claim]").count()) { await page.tap(".fs [data-claim]"); await tick(900); }
  await expect(page.locator(".rw-card")).toContainText("Nog 6 dagen");

  await page.evaluate(() => { Store.relapse("Laat op bed", ""); App.refresh(false); }); await tick(1200);
  await expect(page.locator(".rw-card")).toContainText("Nog 3 dagen");
  await expect(page.locator(".rc-recovery")).toContainText("Begint morgen");
  await page.evaluate(() => { Store.s.journal.push({ ts: Date.now(), text: "Laat en moe" }); Tools.addSession("breath", 60); Tools.addSession("meditate", 600); Store.save(); });
  await context.clock.fastForward(24 * 3600 * 1000); await tick(1500);
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange"))); await tick(2500);
  const close = page.locator(".fs [data-close]").first(); if (await close.count()) { await close.tap(); await tick(800); }
  await expect(page.locator(".rc-recovery")).toContainText("Vandaag is je hersteldag");
  await expect(page.locator(".rc-recovery .rc-count")).toHaveText("3/6");
  for (const t of ["cold", "sun", "move", "nophone", "meditate", "read"]) { await page.tap(`[data-toggle-reset="${t}"]`); await tick(120); }
  await page.evaluate(() => { Store.checkin({ mood: "🙂", energy: 6 }); App.refresh(false); }); await tick(2000);
  await expect(page.locator(".fs")).toContainText("Herstel voltooid");
  await page.tap(".fs [data-close]"); await tick(900);
  await expect(page.locator(".rc-recovery")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("app tracking: setup, Shortcut messages, overview, recap", async ({ page }) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    if (localStorage.getItem("rewired.v1")) return;
    const st = Date.now() - 3 * 864e5, d = new Date();
    localStorage.setItem("rewired.v1", JSON.stringify({ onboarded: true, startDate: st, firstStart: st, celebrated: [1, 3].map(x => x + "@" + st),
      recapSeen: d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0") }));
  });
  await page.goto("/"); await page.waitForTimeout(1500);
  await page.tap('.tab[data-tab="tools"]'); await page.waitForTimeout(1000);
  await page.tap('[data-action="apps"]'); await page.waitForTimeout(800);
  await page.tap('.sheet [data-app="instagram"]'); await page.tap('.sheet [data-app="tiktok"]');
  for (let i = 0; i < 7; i++) await page.tap('.sheet [data-lim="instagram"][data-d="-1"]');
  await page.tap('.sheet [data-test="instagram"]'); await page.waitForTimeout(1500);
  await expect(page.locator("#toast")).toContainText("Instagram: 1e keer vandaag (limiet 3)");

  const link = await page.evaluate(() => `${location.origin}/api/track?t=${encodeURIComponent(Store.s.track.token)}&app=instagram`);
  const msgs = [];
  for (let i = 0; i < 3; i++) msgs.push(await (await fetch(link)).text());
  await fetch(link.replace("app=instagram", "app=tiktok"));
  expect(msgs[1]).toMatch(/^⚠️ Instagram: 3\/3/);
  expect(msgs[2]).toMatch(/^⛔ Instagram: 4× vandaag, 1 boven je limiet/);

  await page.tap(".sheet-backdrop", { position: { x: 10, y: 10 } }); await page.waitForTimeout(700);
  await page.evaluate(() => AppTrack.pull(true)); await page.waitForTimeout(300);
  await page.tap('.tab[data-tab="home"]'); await page.waitForTimeout(1500);
  await expect(page.locator(".at-card")).toContainText("5×");
  await expect(page.locator(".at-chip.over")).toHaveCount(1);
  await page.tap(".at-card"); await page.waitForTimeout(1500);
  await expect(page.locator(".sheet")).toContainText("Over je limiet: Instagram (4/3)");
  const ri = await page.evaluate(() => AppTrack.recapItems(Store.dayKey()));
  expect(ri.bad[0].t).toContain("Instagram: 4× geopend (limiet 3)");
  expect(errors).toEqual([]);
});
