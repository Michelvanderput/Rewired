/* Shared helpers for the end-to-end tests */
const DAY = 864e5;
const BASE = "http://localhost:" + (process.env.PORT || 8800);

/* Seed an onboarded user before the app loads (only when no state exists yet) */
function seed(page, extra = {}, { daysClean = 6.5 } = {}) {
  return page.addInitScript(([extra, daysClean]) => {
    if (localStorage.getItem("rewired.v1")) return;
    const st = Date.now() - daysClean * 864e5;
    const base = { onboarded: true, name: "Michel", startDate: st, firstStart: st, celebrated: [1, 3, 7].map(d => d + "@" + st),
      settings: { sound: true, haptics: true, lightWarned: true } };
    localStorage.setItem("rewired.v1", JSON.stringify(Object.assign(base, extra)));
  }, [extra, daysClean]);
}

/* Pretend today's morning recap was already seen, so it doesn't cover the screen */
function skipRecap(page) {
  return page.addInitScript(() => {
    const orig = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) {
      const v = orig.call(this, k);
      if (k !== "rewired.v1" || !v) return v;
      try {
        const s = JSON.parse(v), d = new Date();
        s.recapSeen = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
        return JSON.stringify(s);
      } catch { return v; }
    };
  });
}

/* Collect JS errors and CSP violations */
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", e => errors.push("pageerror: " + e.message));
  page.on("console", m => { if (m.type() === "error" && /Content Security Policy|Refused to/.test(m.text())) errors.push("csp: " + m.text()); });
  return errors;
}

async function closeOverlay(page) {
  const btn = page.locator(".fs [data-close]").first();
  if (await btn.count()) { await btn.click(); await page.waitForTimeout(600); }
}

/* Close every fullscreen overlay, including ones that open on a delay (milestone 1.2s, recap 2.4s after boot) */
async function closeAllOverlays(page, quiet = 3000) {
  for (let i = 0; i < 6; i++) {
    const btn = page.locator(".fs [data-close]").first();
    try { await btn.waitFor({ state: "visible", timeout: quiet }); } catch { return; }
    await btn.click(); await page.waitForTimeout(600);
  }
}

const getJSON = async p => (await fetch(BASE + p)).json();

module.exports = { DAY, BASE, seed, skipRecap, watchErrors, closeOverlay, closeAllOverlays, getJSON };
