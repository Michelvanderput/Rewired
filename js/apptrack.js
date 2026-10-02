/* App-open tracking via iOS Shortcuts automations: counts, limits and a "realisation" overview */
(function () {
  const { $, esc, haptic, toast, sheet } = FX;
  const DAY = Store.DAY;
  const S = () => Store.s;
  const CACHE = "rewired.appEvents";

  const APPS = [
    { id: "instagram", name: "Instagram", e: "📸", limit: 10 },
    { id: "tiktok", name: "TikTok", e: "🎵", limit: 5 },
    { id: "snapchat", name: "Snapchat", e: "👻", limit: 10 },
    { id: "x", name: "X / Twitter", e: "🐦", limit: 8 },
    { id: "youtube", name: "YouTube", e: "▶️", limit: 8 },
    { id: "reddit", name: "Reddit", e: "👽", limit: 5 },
    { id: "facebook", name: "Facebook", e: "📘", limit: 5 },
    { id: "threads", name: "Threads", e: "🧵", limit: 5 },
    { id: "pinterest", name: "Pinterest", e: "📌", limit: 5 },
    { id: "safari", name: "Safari", e: "🧭", limit: 20 },
    { id: "chrome", name: "Chrome", e: "🌐", limit: 20 },
    { id: "netflix", name: "Netflix", e: "🎬", limit: 2 },
    { id: "twitch", name: "Twitch", e: "🟣", limit: 3 },
    { id: "discord", name: "Discord", e: "🎮", limit: 10 },
    { id: "whatsapp", name: "WhatsApp", e: "💬", limit: 30 },
    { id: "tinder", name: "Tinder", e: "🔥", limit: 3 }
  ];

  const cfg = () => S().track || (S().track = { token: null, apps: {}, perOpen: 3 });
  const configured = () => !!(cfg().token && Object.keys(cfg().apps).length);
  const b64 = a => btoa(String.fromCharCode(...a)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

  function ensureToken() {
    const c = cfg();
    if (!c.token) { c.token = b64(crypto.getRandomValues(new Uint8Array(24))); Store.save(); }
    return c.token;
  }
  const linkFor = id => `${location.origin}/api/track?t=${encodeURIComponent(cfg().token)}&app=${id}`;

  /* ---------- server ---------- */
  let pushTimer = null;
  function pushConfig() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      const c = cfg();
      if (!c.token) return;
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: c.token, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, apps: c.apps }) }).catch(() => {});
    }, 400);
  }

  let events = [];
  try { events = JSON.parse(localStorage.getItem(CACHE) || "[]"); } catch {}
  let lastPull = 0;
  async function pull(force) {
    if (!configured() || (!force && Date.now() - lastPull < 20000)) return false;
    lastPull = Date.now();
    try {
      const r = await fetch("/api/track?t=" + encodeURIComponent(cfg().token), { cache: "no-store" });
      if (!r.ok) return false;
      const data = await r.json();
      const changed = JSON.stringify(data.events) !== JSON.stringify(events);
      events = data.events || [];
      try { localStorage.setItem(CACHE, JSON.stringify(events)); } catch {}
      return changed;
    } catch { return false; }
  }

  /* ---------- numbers ---------- */
  const inDay = (e, day) => Store.dayKey(e.ts) === day;
  function counts(day = Store.dayKey()) {
    const out = {};
    events.forEach(e => { if (inDay(e, day)) out[e.app] = (out[e.app] || 0) + 1; });
    return out;
  }
  const appInfo = id => cfg().apps[id] || APPS.find(a => a.id === id) || { name: id, e: "📱", limit: 0 };

  function realisation(day = Store.dayKey()) {
    const ev = events.filter(e => inDay(e, day) && cfg().apps[e.app]).sort((a, b) => a.ts - b.ts);
    const total = ev.length;
    const minutes = total * (cfg().perOpen || 3);
    let every = null, first = null;
    if (total >= 2) {
      first = ev[0].ts;
      const end = day === Store.dayKey() ? Date.now() : ev[total - 1].ts;
      every = Math.round((end - first) / 60000 / total);
    }
    const hours = new Array(24).fill(0);
    ev.forEach(e => hours[new Date(e.ts).getHours()]++);
    const peak = total ? hours.indexOf(Math.max(...hours)) : null;
    const over = Object.entries(counts(day)).filter(([id, n]) => cfg().apps[id] && cfg().apps[id].limit && n > cfg().apps[id].limit);
    return { total, minutes, every, first, peak, hours, over };
  }

  function week() {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY), k = Store.dayKey(d);
      const c = counts(k);
      out.push({ k, l: ["Z", "M", "D", "W", "D", "V", "Z"][d.getDay()], total: Object.keys(cfg().apps).reduce((a, id) => a + (c[id] || 0), 0), c, today: i === 0 });
    }
    return out;
  }

  /* ---------- UI ---------- */
  function chip(id, n) {
    const a = appInfo(id), over = a.limit && n > a.limit, at = a.limit && n === a.limit;
    return `<span class="at-chip ${over ? "over" : at ? "at" : ""}"><span>${esc(a.e)}</span><b>${n}</b>${a.limit ? `<small>/${a.limit}</small>` : ""}</span>`;
  }

  function cardHtml() {
    if (!configured()) return "";
    const c = counts(), r = realisation();
    return `<button class="card tap at-card" data-action="apps" data-anim>
      <div class="row between" style="width:100%"><div style="font-weight:600">📱 Apps geopend vandaag</div><span class="small muted">${r.total}× · ≈${r.minutes} min</span></div>
      <div class="at-chips">${Object.keys(cfg().apps).map(id => chip(id, c[id] || 0)).join("")}</div>
    </button>`;
  }

  function overviewHtml() {
    const c = counts(), r = realisation(), w = week(), max = Math.max(1, ...w.map(d => d.total));
    const prev = (() => { let t = 0; for (let i = 7; i < 14; i++) { const cc = counts(Store.dayKey(Date.now() - i * DAY)); Object.keys(cfg().apps).forEach(id => t += cc[id] || 0); } return t; })();
    const thisWeek = w.reduce((a, d) => a + d.total, 0);
    const hh = h => String(h).padStart(2, "0") + ":00";
    const lines = [];
    if (r.total) lines.push(`Je opende vandaag <b>${r.total}×</b> een app die je volgt. Dat is ongeveer <b>${r.minutes} minuten</b> (${cfg().perOpen} min per keer).`);
    if (r.every) lines.push(`Gemiddeld pak je je telefoon <b>om de ${r.every} minuten</b> sinds ${new Date(r.first).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" })}.`);
    if (r.peak != null && r.total >= 3) lines.push(`Je piekmoment is rond <b>${hh(r.peak)}</b>. Plan daar iets anders.`);
    if (r.over.length) lines.push(`<span style="color:var(--danger)">Over je limiet: ${r.over.map(([id, n]) => `${appInfo(id).name} (${n}/${appInfo(id).limit})`).join(", ")}.</span>`);
    if (prev && thisWeek) lines.push(`Deze week ${thisWeek}×, vorige week ${prev}×: ${thisWeek <= prev ? `<b style="color:var(--ok)">${Math.round((1 - thisWeek / prev) * 100)}% minder</b> 💪` : `<b style="color:var(--warn)">${Math.round((thisWeek / prev - 1) * 100)}% meer</b>`}.`);
    if (!lines.length) lines.push("Nog niets geopend vandaag. Zo houden! 🙌");
    return `
      ${Object.keys(cfg().apps).map(id => {
        const a = appInfo(id), n = c[id] || 0, p = a.limit ? Math.min(100, n / a.limit * 100) : Math.min(100, n * 5);
        const col = a.limit && n > a.limit ? "var(--danger)" : a.limit && n >= a.limit * 0.8 ? "var(--warn)" : "var(--ok)";
        return `<div class="at-row"><span class="at-e">${esc(a.e)}</span><span style="flex:1;min-width:0"><div class="row between"><b>${esc(a.name)}</b><span class="small ${a.limit && n > a.limit ? "danger-text" : "muted"}">${n}${a.limit ? " / " + a.limit : ""}×</span></div>
          <div class="bar" style="height:7px;margin-top:6px"><i style="width:${p}%;background:${col}"></i></div></span></div>`;
      }).join("")}
      <label class="lbl">Realisatie</label>
      <div class="card at-real">${lines.map(l => `<p>${l}</p>`).join("")}</div>
      <label class="lbl">Laatste 7 dagen</label>
      <div class="h-hist">${w.map(d => `<div class="h-col ${d.today ? "today" : ""}"><div class="h-bar"><i style="height:${Math.max(4, d.total / max * 100)}%;background:var(--accent)"></i></div><span>${d.total || ""}</span><span>${d.l}</span></div>`).join("")}</div>
      <label class="lbl">Per uur vandaag</label>
      <div class="at-hours">${r.hours.map((n, h) => `<i title="${h}:00" style="height:${n ? Math.max(12, n / Math.max(...r.hours) * 100) : 4}%;${n ? "" : "opacity:.25"}"></i>`).join("")}</div>
      <div class="row between small muted" style="margin-top:4px"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>`;
  }

  async function overview() {
    if (!configured()) return setup();
    sheet(`<h2>App-gebruik</h2><p class="sub">Geteld via je iOS Opdrachten-automatiseringen.</p><div data-ov>${overviewHtml()}</div>
      <div style="margin-top:20px"><button class="btn ghost" data-setup>Apps & limieten instellen</button></div>`, {
      onClose() { if (window.App) App.refresh(false); },
      onMount(sh, close) {
        $("[data-setup]", sh).addEventListener("click", () => { close(); setTimeout(setup, 320); });
        pull(true).then(ch => { if (ch && sh.isConnected) $("[data-ov]", sh).innerHTML = overviewHtml(); });
      }
    });
  }

  function setup() {
    ensureToken();
    const draw = () => {
      const c = cfg();
      const chosen = Object.keys(c.apps);
      return `
        <label class="lbl">Welke apps wil je volgen?</label>
        <div class="chips">${APPS.map(a => `<button class="chip ${c.apps[a.id] ? "on" : ""}" data-app="${a.id}">${a.e} ${a.name}</button>`).join("")}</div>
        ${chosen.length ? `<label class="lbl">Limiet per dag (aantal keer openen)</label>
        ${chosen.map(id => { const a = c.apps[id]; return `<div class="at-set">
          <span class="at-e">${esc(a.e)}</span><b style="flex:1">${esc(a.name)}</b>
          <button class="h-step" data-lim="${id}" data-d="-1" style="flex:0;min-width:40px;height:38px">−</button>
          <span class="at-lim">${a.limit || "∞"}</span>
          <button class="h-step pri" data-lim="${id}" data-d="1" style="flex:0;min-width:40px;height:38px">+</button>
        </div>`; }).join("")}
        <label class="lbl">Schatting: minuten per keer openen</label>
        <div class="seg" data-per>${[1, 2, 3, 5, 10].map(n => `<button data-v="${n}" class="${(c.perOpen || 3) === n ? "on" : ""}">${n} min</button>`).join("")}</div>

        <label class="lbl">Zo koppel je het (1× per app, ±1 minuut)</label>
        <div class="card at-steps">
          <ol>
            <li>Open de app <b>Opdrachten</b> → tab <b>Automatisering</b> → <b>＋</b> (Nieuwe automatisering).</li>
            <li>Kies <b>App</b> → <b>Kies</b> → selecteer de app (bijv. Instagram) → vink <b>Is geopend</b> aan.</li>
            <li>Kies <b>Voer direct uit</b> (niet "Vraag voor uitvoeren") → <b>Volgende</b> → <b>Nieuwe lege opdracht</b>.</li>
            <li>Tik <b>Voeg taak toe</b> → zoek <b>Haal inhoud van URL op</b> → tik op "URL" en plak de link van die app hieronder.</li>
            <li>Tik nog eens <b>＋</b> → zoek <b>Toon melding</b> (of <b>Toon waarschuwing</b> voor een pop-up die je echt moet wegtikken) → tik op de tekst → kies <b>Inhoud van URL</b>.</li>
            <li>Tik <b>Gereed</b>. Open de app één keer om te testen.</li>
          </ol>
        </div>
        ${chosen.map(id => `<div class="at-link"><span class="at-e">${esc(c.apps[id].e)}</span><b style="flex:1">${esc(c.apps[id].name)}</b>
          <button class="btn sm" data-copy="${id}">Kopieer link</button><button class="btn ghost sm" data-test="${id}">Test</button></div>`).join("")}
        <p class="small muted" style="margin-top:12px;line-height:1.5">Deze links zijn persoonlijk, deel ze niet. De server ziet alleen welke app wanneer geopend is, niet wat je erin doet.</p>
        <button class="small danger-text" data-stop style="margin-top:14px">Stoppen met app-tracking</button>` : `<p class="small muted" style="margin-top:14px">Kies hierboven minstens één app.</p>`}`;
    };
    sheet(`<h2>App-tracking</h2>
      <p class="sub">Met iOS Opdrachten telt Routini elke keer dat je een app opent. Je krijgt direct een melding ("6e keer vandaag, waarom open je het nu?") en ziet hier hoeveel je ze gebruikt.</p>
      <div data-body>${draw()}</div>`, {
      onClose() { pushConfig(); if (window.App) App.refresh(false); },
      onMount(sh) {
        const body = $("[data-body]", sh), redraw = () => { body.innerHTML = draw(); };
        body.addEventListener("click", async e => {
          const t = e.target;
          const a = t.closest("[data-app]");
          if (a) {
            const c = cfg(), id = a.dataset.app, p = APPS.find(x => x.id === id);
            if (c.apps[id]) delete c.apps[id]; else c.apps[id] = { name: p.name, e: p.e, limit: p.limit };
            Store.save(); pushConfig(); haptic(); Sound.tap(); redraw(); return;
          }
          const l = t.closest("[data-lim]");
          if (l) { const x = cfg().apps[l.dataset.lim]; x.limit = Math.max(0, (x.limit || 0) + +l.dataset.d); Store.save(); pushConfig(); haptic(6); redraw(); return; }
          const per = t.closest("[data-per] button");
          if (per) { cfg().perOpen = +per.dataset.v; Store.save(); redraw(); return; }
          const cp = t.closest("[data-copy]");
          if (cp) {
            pushConfig();
            try { await navigator.clipboard.writeText(linkFor(cp.dataset.copy)); toast("Link gekopieerd, plak hem in Opdrachten"); cp.textContent = "✓ Gekopieerd"; }
            catch { prompt("Kopieer deze link:", linkFor(cp.dataset.copy)); }
            haptic(); return;
          }
          const ts = t.closest("[data-test]");
          if (ts) {
            clearTimeout(pushTimer);
            const c = cfg();
            await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: c.token, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, apps: c.apps }) }).catch(() => {});
            try { const r = await fetch(linkFor(ts.dataset.test)); toast(await r.text()); await pull(true); }
            catch { toast("Test mislukt, geen verbinding"); }
            return;
          }
          if (t.closest("[data-stop]")) {
            const c = cfg();
            if (c.token) fetch("/api/track", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ t: c.token }) }).catch(() => {});
            S().track = { token: null, apps: {}, perOpen: c.perOpen || 3 }; Store.save();
            events = []; try { localStorage.removeItem(CACHE); } catch {}
            toast("App-tracking gestopt. Verwijder ook de automatiseringen in Opdrachten."); redraw();
          }
        });
      }
    });
  }

  /* For the morning recap */
  function recapItems(day) {
    if (!configured()) return { good: [], bad: [], tips: [] };
    const c = counts(day), good = [], bad = [], tips = [];
    Object.entries(cfg().apps).forEach(([id, a]) => {
      const n = c[id] || 0;
      if (a.limit && n > a.limit) {
        bad.push({ e: a.e, t: `${a.name}: ${n}× geopend (limiet ${a.limit})`, short: a.name });
        tips.push(`Zet ${a.name} in een map op je laatste pagina en log uit na gebruik, dan wordt elke keer openen een bewuste keuze.`);
      } else if (a.limit && n <= a.limit) good.push({ e: a.e, t: `${a.name}: ${n}× geopend (binnen limiet ${a.limit})`, short: a.name });
    });
    return { good, bad, tips };
  }

  // keep counts fresh while the app is open
  setInterval(() => { if (!document.hidden && configured()) pull().then(ch => { if (ch && window.App) App.refresh(false); }); }, 60000);

  window.AppTrack = { cardHtml, overview, setup, pull, counts, configured, recapItems, APPS };
})();
