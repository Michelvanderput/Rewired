// Full walkthrough: onboarding, all tabs, tools, panic mode and relapse — with the production CSP active
const { test, expect } = require("@playwright/test");
const { watchErrors, closeAllOverlays } = require("../support/helpers");

test("onboarding → home → tabs → tools → panic → relapse", async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto("/");
  const next = () => page.tap("[data-next]");

  await expect(page.locator("[data-have-account]")).toBeVisible();
  await next();
  await page.fill("[data-name]", "Michel");
  await next();
  // what you work on: gambling + ADHD, with the weekly amount for the money counter
  await page.waitForTimeout(600);
  await page.tap('[data-topics] [data-v="gambling"]'); await page.tap('[data-topics] [data-v="adhd"]');
  await page.fill("[data-money]", "50");
  await next();
  // the "how often" answers must become fully visible (regression: CSS transition froze GSAP)
  await page.waitForTimeout(1200);
  const opacities = await page.$$eval(".opt", els => els.map(e => +getComputedStyle(e).opacity));
  expect(opacities.every(o => o > 0.95), "answers fully visible: " + opacities).toBe(true);
  await page.tap(".opt >> nth=1");
  await next(); await page.waitForTimeout(500); await page.tap(".chip >> nth=0");
  await next(); await page.waitForTimeout(500); await page.tap(".chip >> nth=0");
  await next(); await page.waitForTimeout(500); await page.tap(".opt >> nth=3"); // a week ago
  await next(); await page.waitForTimeout(800);
  const box = await page.locator("[data-sig]").boundingBox();
  await page.mouse.move(box.x + 30, box.y + 90); await page.mouse.down();
  await page.mouse.move(box.x + 200, box.y + 60, { steps: 8 }); await page.mouse.up();
  await next(); await page.waitForTimeout(600);
  await expect(page.locator("[data-date]")).toBeVisible();
  await next(); await page.waitForTimeout(1500);
  await closeAllOverlays(page); // milestone celebration (1 week) + recap of yesterday
  await expect(page.locator("[data-days]")).toHaveText("7");
  expect(await page.evaluate(() => Store.s.signature.startsWith("data:image/png"))).toBe(true);
  expect(await page.evaluate(() => [Store.s.focus, Store.s.focusMoney])).toEqual([["gambling", "adhd"], 50]);
  await expect(page.locator(".fp-money")).toContainText("€ 50 niet vergokt"); // a week ago × €50 per week
  await expect(page.locator(".fp-card")).toContainText("Je startplan");

  // home interactions
  await page.tap('[data-toggle-reset="cold"]');
  await expect(page.locator("[data-reset-count]")).toHaveText("1/8");
  await page.tap('[data-action="checkin"]'); await page.waitForTimeout(600);
  await page.tap(".mood-row button >> nth=3"); await page.tap(".sheet [data-save]"); await page.waitForTimeout(700);
  await page.tap('[data-action="urge"]'); await page.waitForTimeout(600);
  await page.tap(".sheet .chip >> nth=1"); await page.tap(".sheet [data-save]"); await page.waitForTimeout(700);
  expect(await page.evaluate(() => Store.s.urges.length)).toBe(1);

  for (const t of ["tools", "progress", "learn", "profile", "home"]) {
    await page.tap(`.tab[data-tab="${t}"]`);
    await expect(page.locator(`.tab[data-tab="${t}"]`)).toHaveClass(/active/);
    await page.waitForTimeout(500);
  }

  // tools
  await page.tap('.tab[data-tab="tools"]'); await page.waitForTimeout(800);
  await page.tap('[data-action="light"]'); await page.waitForTimeout(600);
  await page.tap(".sheet [data-ok]"); await page.waitForTimeout(800);
  await page.tap(".sheet [data-start]"); await page.waitForTimeout(1200);
  await expect(page.locator(".fs .light-timer")).toBeVisible();
  await page.tap(".fs [data-close]"); await page.waitForTimeout(700);
  await page.tap('[data-action="breath"]'); await page.waitForTimeout(600);
  await page.tap('.mode-card[data-id="box"]'); await page.waitForTimeout(2500);
  await expect(page.locator(".fs .breath-circle")).toBeVisible();
  await page.tap(".fs [data-close]"); await page.waitForTimeout(700);
  await page.tap('[data-action="meditate"]'); await page.waitForTimeout(600);
  await page.tap(".sheet [data-start]"); await page.waitForTimeout(1500);
  await expect(page.locator(".fs .med-orb")).toBeVisible();
  await page.tap(".fs [data-close]"); await page.waitForTimeout(700);

  // panic mode, including tools opened from it (regression: sheets hidden behind the overlay)
  await page.tap("#panicBtn"); await page.waitForTimeout(800);
  for (let i = 0; i < 3; i++) { await page.tap(".fs [data-next]"); await page.waitForTimeout(700); }
  await page.tap('[data-act="light"]'); await page.waitForTimeout(800);
  await page.tap(".sheet [data-start]"); await page.waitForTimeout(1000);
  await expect(page.locator(".fs .light-timer")).toBeVisible();
  await page.locator(".fs").nth(1).locator("[data-close]").tap(); await page.waitForTimeout(700);
  await page.tap(".fs [data-next]"); await page.waitForTimeout(700);
  await page.tap(".fs [data-win]"); await page.waitForTimeout(1200);
  await page.tap(".fs .btn >> text=Klaar"); await page.waitForTimeout(700);
  expect(await page.evaluate(() => Store.resisted())).toBe(2);

  // relapse
  await page.tap('.tab[data-tab="home"]'); await page.waitForTimeout(800);
  await page.tap('[data-action="relapse"]'); await page.waitForTimeout(600);
  await page.tap(".sheet [data-save]"); await page.waitForTimeout(2500);
  await page.tap(".fs [data-close]"); await page.waitForTimeout(800);
  await expect(page.locator("[data-days]")).toHaveText("0");
  await expect(page.locator(".rc-recovery")).toBeVisible();

  expect(errors).toEqual([]);
});

test("security headers are served", async ({ request }) => {
  const r = await request.get("/");
  const h = r.headers();
  expect(h["content-security-policy"]).toContain("script-src 'self'");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["referrer-policy"]).toBeTruthy();
  expect(h["permissions-policy"]).toContain("camera=()");
});
