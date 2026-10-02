// Layout guard: nothing that is fully on screen may sit closer than 12px to the left or right edge.
// Items that are partly off screen belong to a horizontal scroll row and are allowed.
const { test, expect } = require("@playwright/test");
const { seed, skipRecap, closeAllOverlays } = require("../support/helpers");

const tooClose = () => {
  const W = innerWidth, out = [];
  const root = document.querySelector(".sheet") ? ".sheet *" : "#view *";
  document.querySelectorAll(root).forEach(el => {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || r.bottom < 0 || r.top > innerHeight || r.width >= W - 1) return;
    // part of a horizontal scroll row (itself or a parent card is cut off by the screen edge)
    for (let p = el; p && p !== document.body; p = p.parentElement) { const q = p.getBoundingClientRect(); if (q.left < 0 || q.right > W + 0.5) return; }
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || +cs.opacity === 0 || el.classList.contains("glow")) return;
    const text = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    const box = cs.borderTopWidth !== "0px" || !/rgba\(0, 0, 0, 0\)|transparent/.test(cs.backgroundColor);
    if ((text || box) && (r.left < 12 || W - r.right < 12)) out.push(`${el.tagName}.${String(el.className).slice(0, 30)} L${Math.round(r.left)} R${Math.round(W - r.right)}`);
  });
  return out;
};

test("page gutters on every tab and in the main sheets", async ({ page }) => {
  test.setTimeout(180000);
  await seed(page, {}, { daysClean: 6.5 }); await skipRecap(page);
  await page.goto("/"); await page.waitForTimeout(1000); await closeAllOverlays(page);
  for (const t of ["home", "tools", "progress", "learn", "profile"]) {
    await page.tap(`.tab[data-tab="${t}"]`); await page.waitForTimeout(1000);
    const H = await page.evaluate(() => document.querySelector("#view").scrollHeight);
    for (let y = 0; y < Math.min(H, 3500); y += 650) {
      await page.evaluate(y => document.querySelector("#view").scrollTo(0, y), y); await page.waitForTimeout(150);
      expect(await page.evaluate(tooClose), `${t} @${y}`).toEqual([]);
    }
  }
  // learning paths: the first card keeps the gutter, also after scrolling the row and back
  await page.tap('.tab[data-tab="learn"]'); await page.waitForTimeout(1000);
  await page.evaluate(() => document.querySelector(".ln-paths").scrollIntoView({ block: "center" })); await page.waitForTimeout(300);
  const left = () => page.evaluate(() => Math.round(document.querySelector(".ln-path").getBoundingClientRect().left));
  expect(await left()).toBeGreaterThanOrEqual(16);
  await page.evaluate(() => { document.querySelector(".ln-paths").scrollLeft = 9999; }); await page.waitForTimeout(400);
  expect(await page.evaluate(() => { const l = [...document.querySelectorAll(".ln-path")].at(-1); return Math.round(innerWidth - l.getBoundingClientRect().right); })).toBeGreaterThanOrEqual(16);
  await page.evaluate(() => { document.querySelector(".ln-paths").scrollLeft = 0; }); await page.waitForTimeout(400);
  expect(await left()).toBeGreaterThanOrEqual(16);

  for (const open of [() => Habits.openHabit(Store.s.habits[0].id), () => Habits.editHabit(Store.s.habits[0].id), () => Habits.addSheet(), () => Reflect.open()]) {
    await page.evaluate(`(${open})()`); await page.waitForTimeout(900);
    const H = await page.evaluate(() => document.querySelector(".sheet").scrollHeight);
    for (let y = 0; y < Math.min(H, 3000); y += 600) {
      await page.evaluate(y => document.querySelector(".sheet").scrollTo(0, y), y); await page.waitForTimeout(150);
      expect(await page.evaluate(tooClose), `sheet ${open} @${y}`).toEqual([]);
    }
    await page.evaluate(() => document.querySelectorAll(".sheet,.sheet-backdrop").forEach(e => e.remove()));
  }
});
