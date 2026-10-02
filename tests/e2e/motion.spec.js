// Reduced motion: iOS "Verminder beweging" (or the in-app switch) stops decorative loops and confetti
const { test, expect } = require("@playwright/test");
const { seed, skipRecap, watchErrors } = require("../support/helpers");

const loops = page => page.evaluate(() => ({ blobs: gsap.getTweensOf(".b1").length, ring: gsap.getTweensOf(".panic-ring").length, orb: gsap.getTweensOf("[data-orb]").length }));

test("system reduced-motion setting is respected", async ({ page }) => {
  const errors = watchErrors(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);
  expect(await loops(page)).toEqual({ blobs: 0, ring: 0, orb: 0 });
  await page.evaluate(() => FX.confetti(50));
  expect(await page.locator(".confetti").count()).toBe(0);
  expect(errors).toEqual([]);
});

test("in-app switch turns motion off and on again", async ({ page }) => {
  await seed(page); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1500);
  expect((await loops(page)).blobs).toBeGreaterThan(0);
  await page.tap('.tab[data-tab="profile"]');
  await page.tap('[data-setting="calm"]');
  expect(await loops(page)).toMatchObject({ blobs: 0, ring: 0 });
  await page.tap('[data-setting="calm"]');
  expect((await loops(page)).blobs).toBeGreaterThan(0);
});
