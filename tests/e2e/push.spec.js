// Push notifications: install hint, enabling, preferences, test push, deep link, disabling
const { test, expect, devices } = require("@playwright/test");
const { getJSON, skipRecap, watchErrors, seed } = require("../support/helpers");

async function phone(browser, { standalone, perm = "default", answer = "granted" }) {
  const FAKE = await getJSON("/__fakesub");
  const ctx = await browser.newContext({ ...devices["iPhone 15"], locale: "nl-NL", timezoneId: "Europe/Amsterdam", baseURL: "http://localhost:8800" });
  const page = await ctx.newPage();
  const errors = watchErrors(page);
  await skipRecap(page);
  await seed(page);
  await page.addInitScript(([FAKE, standalone, perm, answer]) => {
    if (standalone) Object.defineProperty(navigator, "standalone", { get: () => true });
    let permission = localStorage.getItem("__perm") || perm;
    Object.defineProperty(Notification, "permission", { get: () => permission });
    Notification.requestPermission = async () => { permission = answer; localStorage.setItem("__perm", permission); return permission; };
    let sub = null;
    const fake = { endpoint: FAKE.endpoint, toJSON: () => FAKE, unsubscribe: async () => { sub = null; localStorage.removeItem("__sub"); return true; } };
    if (localStorage.getItem("__sub")) sub = fake;
    PushManager.prototype.subscribe = async function () { sub = fake; localStorage.setItem("__sub", "1"); return sub; };
    PushManager.prototype.getSubscription = async function () { return sub; };
  }, [FAKE, standalone, perm, answer]);
  await page.goto("/"); await page.waitForTimeout(1500);
  return { ctx, page, errors, FAKE };
}
const subRecord = async () => { const db = await getJSON("/__db"); const k = Object.keys(db).find(k => k.startsWith("sub:")); return k && JSON.parse(db[k]); };

test("Safari (not installed) shows the install hint", async ({ browser }) => {
  const { ctx, page } = await phone(browser, { standalone: false });
  await expect(page.locator('[data-action="pushSetup"]')).toHaveCount(0);
  await page.tap('.tab[data-tab="profile"]'); await page.waitForTimeout(1200);
  await expect(page.locator("[data-push]")).toContainText("beginscherm");
  await ctx.close();
});

test("enable, change times, test push, deep link, disable", async ({ browser }) => {
  const { ctx, page, errors } = await phone(browser, { standalone: true });
  await page.tap('[data-action="pushSetup"]'); await page.waitForTimeout(1500);
  let rec = await subRecord();
  expect(rec.tz).toBe("Europe/Amsterdam");
  expect(rec.reminders.morning).toEqual({ on: true, time: "08:00" });

  await page.tap('.tab[data-tab="profile"]'); await page.waitForTimeout(1200);
  await page.fill('[data-time="evening"]', "21:45"); await page.dispatchEvent('[data-time="evening"]', "change");
  await page.tap('[data-rem-on="midday"]'); await page.waitForTimeout(2500);
  rec = await subRecord();
  expect(rec.reminders.evening.time).toBe("21:45");
  expect(rec.reminders.midday.on).toBe(true);

  await page.tap("[data-push-test]"); await page.waitForTimeout(7000);
  const sent = await getJSON("/__sent");
  expect(sent.at(-1).msg.body).toContain("Test gelukt");

  await page.goto("/?open=checkin"); await page.waitForTimeout(2500);
  await expect(page.locator(".sheet h2")).toHaveText("Dagelijkse check-in");
  expect(page.url()).not.toContain("open=");

  await page.goto("/"); await page.waitForTimeout(1200);
  await page.tap('.tab[data-tab="profile"]'); await page.waitForTimeout(1200);
  await page.tap("[data-push-master]"); await page.waitForTimeout(1200);
  expect(await subRecord()).toBeUndefined();
  expect(errors).toEqual([]);
  await ctx.close();
});

test("denied permission explains how to fix it", async ({ browser }) => {
  const { ctx, page } = await phone(browser, { standalone: true, answer: "denied" });
  await page.tap('[data-action="pushSetup"]'); await page.waitForTimeout(800);
  await expect(page.locator("#toast")).toContainText("geweigerd");
  await page.tap('.tab[data-tab="profile"]'); await page.waitForTimeout(1200);
  await expect(page.locator("[data-push]")).toContainText("geblokkeerd");
  await ctx.close();
});
