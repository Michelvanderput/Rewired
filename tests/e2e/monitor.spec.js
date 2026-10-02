// Opt-in crash reporting: nothing leaves the phone until the user turns it on, and messages are scrubbed
const { test, expect } = require("@playwright/test");
const { seed, skipRecap } = require("../support/helpers");

test("error reporting is opt-in and scrubbed", async ({ page }) => {
  const reports = [];
  await page.route(/ingest\.de\.sentry\.io/, route => { reports.push(route.request()); route.fulfill({ status: 200, body: "{}" }); });
  await seed(page); await skipRecap(page);
  await page.goto("/");
  await page.evaluate(() => Monitor.ready);
  const boom = () => page.evaluate(() => setTimeout(() => { throw new TypeError('kon "mijn geheime dagboek" niet lezen'); }));

  await boom(); await page.waitForTimeout(500);
  expect(reports).toHaveLength(0); // off by default

  await page.tap('.tab[data-tab="profile"]');
  const toggle = page.locator('[data-setting="errors"]');
  await expect(toggle).toBeVisible();
  await toggle.tap();
  expect(await page.evaluate(() => Store.s.settings.errors)).toBe(true);

  await boom(); await page.waitForTimeout(800);
  expect(reports).toHaveLength(1);
  const r = reports[0];
  expect(r.url()).toContain("/api/42/envelope/?sentry_key=publickey");
  const [, , ev] = r.postData().split("\n").map(JSON.parse);
  expect(ev.exception.values[0]).toMatchObject({ type: "TypeError", value: 'kon "…" niet lezen' });
  expect(r.postData()).not.toContain("geheime");
  expect(r.postData()).not.toContain("Michel");
  expect(ev.release).toMatch(/^routini-v\d+$/);
});
