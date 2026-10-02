// Accounts and end-to-end encrypted sync between two phones
const { test, expect, devices } = require("@playwright/test");
const { getJSON, skipRecap, watchErrors } = require("../support/helpers");

async function phone(browser, seedData) {
  const ctx = await browser.newContext({ ...devices["iPhone 15"], locale: "nl-NL", timezoneId: "Europe/Amsterdam", baseURL: "http://localhost:8800" });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await skipRecap(page);
  if (seedData) await page.addInitScript(() => {
    if (localStorage.getItem("rewired.v1")) return;
    const D = 864e5, st = Date.now() - 9.2 * D;
    localStorage.setItem("rewired.v1", JSON.stringify({ onboarded: true, name: "Michel", startDate: st, firstStart: Date.now() - 30 * D, bestStreak: 14 * D, reasons: ["Meer energie en focus"],
      journal: [{ ts: Date.now() - D, text: "GEHEIM dagboek van A", mood: "🙂" }], relapses: [{ ts: st, trigger: "Stress", streakMs: 14 * D }],
      urges: [{ ts: Date.now() - 2 * D, intensity: 7, trigger: "Verveling", resisted: true }], lessonsDone: ["l1"], celebrated: [1, 3, 7].map(d => d + "@" + st), updatedAt: Date.now() - 1000 }));
  });
  await page.goto("/"); await page.waitForTimeout(1500);
  return { ctx, page, errors };
}

test("register, restore on a new phone, merge, relapse sync, delete", async ({ browser }) => {
  const user = "michel" + Date.now().toString(36);
  const A = await phone(browser, true);
  await A.page.tap('.tab[data-tab="profile"]'); await A.page.waitForTimeout(1200);
  await A.page.tap('[data-acc="register"]'); await A.page.waitForTimeout(600);
  await A.page.fill(".sheet [data-u]", user); await A.page.fill(".sheet [data-p]", "kort");
  await A.page.tap(".sheet [data-go]");
  await expect(A.page.locator(".sheet [data-err]")).toContainText("8 tekens");
  await A.page.fill(".sheet [data-p]", "SterkWachtwoord1"); await A.page.fill(".sheet [data-p2]", "SterkWachtwoord1");
  await A.page.tap(".sheet [data-go]");
  await A.page.waitForSelector(".sheet", { state: "detached", timeout: 20000 });
  await expect(A.page.locator("[data-sync]")).toContainText(user);

  const db = await getJSON("/__db");
  const blob = db["data:" + user];
  expect(blob).toBeTruthy();
  expect(blob).not.toMatch(/GEHEIM|Michel|Stress/);
  expect(db["user:" + user]).not.toContain("SterkWachtwoord1");

  const B = await phone(browser, false);
  await B.page.tap("[data-have-account]"); await B.page.waitForTimeout(600);
  await B.page.fill(".sheet [data-u]", user); await B.page.fill(".sheet [data-p]", "FoutWachtwoord");
  await B.page.tap(".sheet [data-go]");
  await expect(B.page.locator(".sheet [data-err]")).toContainText("klopt niet", { timeout: 15000 });
  await B.page.fill(".sheet [data-p]", "SterkWachtwoord1"); await B.page.tap(".sheet [data-go]");
  await B.page.waitForSelector(".ob", { state: "detached", timeout: 20000 }); await B.page.waitForTimeout(2000);
  const fsClose = B.page.locator(".fs [data-close]").first(); if (await fsClose.count()) await fsClose.tap();
  const bs = await B.page.evaluate(() => Store.s);
  expect(bs.name).toBe("Michel");
  expect(bs.journal[0].text).toBe("GEHEIM dagboek van A");
  await expect(B.page.locator("[data-days]")).toHaveText("9");

  await A.page.evaluate(() => { Store.s.journal.push({ ts: Date.now(), text: "Van A" }); Store.save(); });
  await B.page.evaluate(() => { Store.s.journal.push({ ts: Date.now() + 5, text: "Van B" }); Store.logUrge({ intensity: 5, trigger: "Moe", resisted: true }); });
  await A.page.waitForTimeout(4000); await B.page.waitForTimeout(4000);
  // a sync already in flight is returned as-is, so keep syncing until B's upload has arrived (eventual consistency)
  await expect.poll(async () => A.page.evaluate(async () => { await Sync.sync(); return Store.s.journal.map(j => j.text); }), { timeout: 15000 })
    .toEqual(expect.arrayContaining(["Van A", "Van B"]));
  expect(await A.page.evaluate(() => Store.s.urges.length)).toBe(2);

  await B.page.evaluate(() => Store.relapse("Laat op bed", ""));
  await expect.poll(async () => A.page.evaluate(async () => { await Sync.sync(); return Store.streakDays(); }), { timeout: 15000 }).toBe(0);

  await A.page.tap('.tab[data-tab="profile"]'); await A.page.waitForTimeout(1200);
  await A.page.tap('[data-acc="logout"]'); await A.page.waitForTimeout(1200);
  expect(await A.page.evaluate(() => Store.s.journal.length)).toBeGreaterThanOrEqual(3);
  await B.page.tap('.tab[data-tab="profile"]'); await B.page.waitForTimeout(1200);
  await B.page.tap('[data-acc="delete"]'); await B.page.waitForTimeout(600);
  await B.page.fill(".sheet [data-p]", "SterkWachtwoord1"); await B.page.tap(".sheet [data-yes]");
  await expect.poll(async () => { const db2 = await getJSON("/__db"); return [db2["user:" + user], db2["data:" + user]]; }, { timeout: 15000 }).toEqual([undefined, undefined]);
  expect(A.errors).toEqual([]);
  expect(B.errors).toEqual([]);
  await A.ctx.close(); await B.ctx.close();
});
