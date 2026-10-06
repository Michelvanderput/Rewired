/* Web push reminders (iOS 16.4+ when installed on the home screen) */
(function () {
  const { esc, haptic, toast } = FX;
  const KEY_CACHE = "rewired.vapid";

  const REMINDERS = [
    { id: "morning", e: "🌅", t: "Ochtend-recap", s: "Hoe ging gisteren + streak", def: "08:00", on: true },
    { id: "midday", e: "💡", t: "Middag", s: "Gedachte van de dag", def: "12:30", on: false },
    { id: "evening", e: "✍️", t: "Avond check-in", s: "Log je stemming", def: "21:00", on: true },
    { id: "night", e: "🌙", t: "Bedtijd", s: "Telefoon weg, naar bed", def: "23:00", on: true },
    { id: "rmorning", e: "🌅", t: "Ochtendroutine", s: "Start je dag bewust · niet als hij al gedaan is", def: "07:00", on: true },
    { id: "revening", e: "🌙", t: "Avondroutine", s: "Sluit je dag af · niet als hij al gedaan is", def: "22:00", on: true },
    { id: "weekly", e: "🪞", t: "Weekreflectie", s: "Zondag · 3 vragen over je week", def: "19:00", on: true }
  ];
  /* Habit reminders per moment of the day; which habits are included fades with automaticity (Habits.nudges) */
  const NUDGE_TIMES = { n0: ["🌅", "Ochtend", "07:30"], n1: ["☀️", "Middag", "12:30"], n2: ["🏁", "Na werk", "17:30"], n3: ["🌙", "Avond", "20:30"] };

  function prefs() {
    const s = Store.s;
    if (!s.push) s.push = { subscribed: false, dismissed: false, reminders: {} };
    REMINDERS.forEach(r => { if (!s.push.reminders[r.id]) s.push.reminders[r.id] = { on: r.on, time: r.def }; });
    if (!s.push.nudgeTimes) s.push.nudgeTimes = Object.fromEntries(Object.entries(NUDGE_TIMES).map(([k, v]) => [k, v[2]]));
    return s.push;
  }

  const supported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const standalone = () => !!(navigator.standalone || matchMedia("(display-mode: standalone)").matches);
  const isIOS = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  function b64ToBytes(b64) {
    const pad = "=".repeat((4 - (b64.length % 4)) % 4);
    const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
    return Uint8Array.from(raw, c => c.charCodeAt(0));
  }

  /* Fetch (and cache) the server's public key. Returns null + reason when the server isn't set up. */
  let keyInfo = null;
  async function publicKey() {
    if (keyInfo && keyInfo.key) return keyInfo;
    try {
      const r = await fetch("/api/vapid", { cache: "no-store" });
      if (r.ok) {
        const { publicKey } = await r.json();
        try { localStorage.setItem(KEY_CACHE, publicKey); } catch {}
        keyInfo = { key: publicKey };
      } else {
        keyInfo = { key: null, reason: r.status === 503 ? "config" : "server" };
      }
    } catch {
      let cached = null; try { cached = localStorage.getItem(KEY_CACHE); } catch {}
      keyInfo = cached ? { key: cached } : { key: null, reason: "offline" };
    }
    return keyInfo;
  }

  async function registration() {
    return navigator.serviceWorker.ready;
  }

  /* Personal risk moments (from the urge log) become extra reminders, 15 minutes before each window */
  function risk() {
    if (!window.Risk || prefs().risk === false) return { reminders: {}, risks: [] };
    return Risk.pushReminders();
  }
  /* Habit nudges for today and tomorrow, only for moments that have something to remind */
  function habitNudges() {
    if (!window.Habits || prefs().nudge === false) return { reminders: {}, nudges: {} };
    const n = Habits.nudges(), reminders = {};
    Object.keys(n).forEach(id => { reminders[id] = { on: true, time: prefs().nudgeTimes[id] || NUDGE_TIMES[id][2] }; });
    return { reminders, nudges: n };
  }
  /* The weekly reminder is only useful while this week's reflection is still open */
  function weeklyReminder() {
    const r = prefs().reminders.weekly;
    return { weekly: Object.assign({}, r, { on: !!r.on && !(window.Reflect && Reflect.doneThisWeek()) }) };
  }
  const doneDays = () => (window.Routine ? Routine.doneDays() : {});
  const sig = () => JSON.stringify([doneDays(), Store.s.startDate, Store.s.name, prefs().reminders, prefs().risk, prefs().nudge, prefs().nudgeTimes, risk(), habitNudges(), weeklyReminder(), window.Recap && Recap.summary(Store.dayKey())]);

  function payload(sub) {
    const s = Store.s, r = risk(), hn = habitNudges();
    return {
      subscription: sub.toJSON ? sub.toJSON() : sub,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Amsterdam",
      reminders: Object.assign({}, prefs().reminders, weeklyReminder(), r.reminders, hn.reminders),
      risks: r.risks,
      nudges: hn.nudges,
      doneDays: doneDays(),
      startDate: s.startDate,
      name: s.name || "",
      // yesterday + today so the morning notification can summarise the day that just ended
      recaps: window.Recap ? [Recap.summary(Recap.yesterday()), Recap.summary(Store.dayKey())].filter(Boolean) : []
    };
  }

  async function sync() {
    if (!supported() || !prefs().subscribed || Notification.permission !== "granted") return false;
    const reg = await registration();
    const sub = await reg.pushManager.getSubscription();
    if (!sub) return false;
    const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(sub)) });
    return r.ok;
  }

  let syncTimer = null, lastSig = "";
  function scheduleSync() {
    const p = prefs();
    if (!p.subscribed) return;
    const now = sig();
    if (now === lastSig) return;
    lastSig = now;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => sync().catch(() => {}), 1500);
  }

  /* Must be called straight from a tap: iOS only shows the permission prompt inside a user gesture. */
  async function enable() {
    if (!supported()) throw new Error("unsupported");
    const perm = await Notification.requestPermission();
    if (perm !== "granted") throw new Error(perm === "denied" ? "denied" : "dismissed");
    const k = await publicKey();
    if (!k.key) throw new Error(k.reason || "config");
    const reg = await registration();
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(k.key) });
    const r = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(sub)) });
    if (!r.ok) throw new Error("server");
    prefs().subscribed = true; Store.save();
    lastSig = sig();
  }

  async function disable() {
    const reg = await registration();
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      fetch("/api/subscribe", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
      await sub.unsubscribe().catch(() => {});
    }
    prefs().subscribed = false; Store.save();
  }

  async function test() {
    const reg = await registration();
    const sub = await reg.pushManager.getSubscription();
    if (!sub) throw new Error("not subscribed");
    const r = await fetch("/api/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint, delay: 5 }) });
    if (r.status === 404 || r.status === 410) { await sync(); throw new Error("resubscribe"); }
    if (!r.ok) throw new Error("server");
  }

  /* On app start: re-create a lost subscription and push fresh data to the server */
  async function ensure() {
    if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
    if (!supported() || !prefs().subscribed) return;
    if (Notification.permission !== "granted") { prefs().subscribed = false; Store.save(); return; }
    try {
      const reg = await registration();
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const k = await publicKey();
        if (!k.key) return;
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(k.key) });
      }
      await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload(sub)) });
      lastSig = sig();
    } catch {}
  }

  /* ---------------- UI ---------------- */

  function status() {
    if (!supported()) {
      if (isIOS() && !standalone()) return "install";
      return isIOS() ? "ios-old" : "unsupported";
    }
    if (isIOS() && !standalone()) return "install";
    if (Notification.permission === "denied") return "denied";
    return prefs().subscribed && Notification.permission === "granted" ? "on" : "off";
  }

  function switchHtml(on, attrs) {
    return `<button class="switch ${on ? "on" : ""}" ${attrs} role="switch" aria-checked="${on}"><i></i></button>`;
  }

  function cardHtml() {
    const st = status(), p = prefs();
    if (st === "install") return `<div class="card"><div style="font-weight:600">🔔 Meldingen</div><p class="small muted" style="margin-top:6px">Op de iPhone werken meldingen alleen als Routini op je <b style="color:#fff">beginscherm</b> staat. Open in Safari → <b style="color:#fff">Deel</b> → <b style="color:#fff">Zet op beginscherm</b>, en open de app daarna via het icoon.</p></div>`;
    if (st === "ios-old") return `<div class="card"><div style="font-weight:600">🔔 Meldingen</div><p class="small muted" style="margin-top:6px">Je iOS-versie ondersteunt geen webmeldingen. Update naar iOS 16.4 of nieuwer.</p></div>`;
    if (st === "unsupported") return `<div class="card"><div style="font-weight:600">🔔 Meldingen</div><p class="small muted" style="margin-top:6px">Deze browser ondersteunt geen pushmeldingen.</p></div>`;
    if (st === "denied") return `<div class="card"><div style="font-weight:600">🔔 Meldingen geblokkeerd</div><p class="small muted" style="margin-top:6px">Zet ze aan via iPhone <b style="color:#fff">Instellingen → Meldingen → Routini</b> en kom dan hier terug.</p></div>`;

    const on = st === "on";
    return `
      <div class="card flush">
        <div class="list-item"><span class="li-ico">🔔</span><span class="li-body"><div class="li-title">Herinneringen</div><div class="li-sub">${on ? "Aan · je krijgt meldingen op je iPhone" : "Blijf op koers met dagelijkse reminders"}</div></span>${switchHtml(on, "data-push-master")}</div>
        ${on ? REMINDERS.map(r => {
          const v = p.reminders[r.id];
          return `<div class="list-item rem" data-rem="${r.id}"><span class="li-body"><div class="li-title">${r.e} ${r.t}</div><div class="li-sub">${r.s}</div></span>
            <input type="time" class="time-in" value="${esc(v.time)}" data-time="${r.id}" ${v.on ? "" : "disabled"}>
            ${switchHtml(v.on, `data-rem-on="${r.id}"`)}</div>`;
        }).join("") + riskRowHtml() + nudgeRowsHtml() + `<div style="padding:12px 16px 16px"><button class="btn ghost sm" style="width:100%" data-push-test>Stuur testmelding</button></div>` : ""}
      </div>`;
  }

  function nudgeRowsHtml() {
    const on = prefs().nudge !== false;
    return `<div class="list-item rem"><span class="li-body"><div class="li-title">🧭 Gewoonte-herinneringen</div><div class="li-sub">Op het moment uit je als-dan-plan. Worden minder naarmate een gewoonte vanzelf gaat.</div></span>
      ${switchHtml(on, "data-nudge-on")}</div>` + (on ? Object.entries(NUDGE_TIMES).map(([id, [e, t]]) => `<div class="list-item rem" style="padding-left:34px"><span class="li-body"><div class="li-title" style="font-size:15px">${e} ${t}</div></span>
      <input type="time" class="time-in" value="${esc(prefs().nudgeTimes[id])}" data-nudge-time="${id}"></div>`).join("") : "");
  }

  function riskRowHtml() {
    const n = window.Risk ? Risk.moments().length : 0, on = prefs().risk !== false;
    return `<div class="list-item rem"><span class="li-body"><div class="li-title">⚠️ Vooraf bij risicomoment</div><div class="li-sub">${n ? `15 min voor je ${n} risicomoment${n === 1 ? "" : "en"} (${Risk.moments().map(m => m.label.split("–")[0]).join(", ")})` : `Werkt na ${window.Risk ? Risk.NEED : 10} drang-logs`}</div></span>
      ${switchHtml(on, "data-risk-on")}</div>`;
  }

  async function mount(el) {
    if (!el) return;
    el.innerHTML = cardHtml();
    // warn early when the server side isn't configured yet
    if (status() === "off") {
      publicKey().then(k => {
        if (!k.key && k.reason === "config" && el.isConnected) {
          el.insertAdjacentHTML("beforeend", `<p class="small" style="color:var(--warn);margin:10px 4px 0">⚠️ De meldingsserver is nog niet ingesteld (zie README → Pushmeldingen).</p>`);
        }
      });
    }
    el.onclick = async e => {
      const master = e.target.closest("[data-push-master]");
      if (master) {
        haptic(); Sound.tap();
        if (master.classList.contains("on")) {
          await disable(); toast("Meldingen uitgezet"); mount(el); return;
        }
        master.classList.add("busy");
        try {
          await enable();
          Sound.success(); toast("Meldingen staan aan 🔔");
        } catch (err) {
          const m = err.message;
          toast(m === "denied" ? "Toestemming geweigerd" : m === "dismissed" ? "Geen toestemming gegeven" : m === "config" ? "Server nog niet ingesteld" : m === "offline" ? "Geen internet" : "Aanzetten mislukt, probeer opnieuw");
        }
        mount(el);
        return;
      }
      const nu = e.target.closest("[data-nudge-on]");
      if (nu) {
        const p = prefs(); p.nudge = p.nudge === false; Store.save(); haptic(); Sound.toggle(p.nudge);
        mount(el); scheduleSync();
        return;
      }
      const rk = e.target.closest("[data-risk-on]");
      if (rk) {
        const p = prefs(); p.risk = p.risk === false; Store.save(); haptic(); Sound.toggle(p.risk);
        rk.classList.toggle("on", p.risk); rk.setAttribute("aria-checked", p.risk);
        scheduleSync();
        return;
      }
      const ro = e.target.closest("[data-rem-on]");
      if (ro) {
        const r = prefs().reminders[ro.dataset.remOn];
        r.on = !r.on; Store.save(); haptic(); Sound.toggle(r.on);
        ro.classList.toggle("on", r.on); ro.setAttribute("aria-checked", r.on);
        el.querySelector(`[data-time="${ro.dataset.remOn}"]`).disabled = !r.on;
        scheduleSync();
        return;
      }
      if (e.target.closest("[data-push-test]")) {
        const b = e.target.closest("[data-push-test]");
        b.disabled = true; b.textContent = "Ga nu naar je beginscherm…";
        toast("Melding komt over 5 sec, ga naar je beginscherm 📲");
        try { await sync(); await test(); }
        catch (err) { toast(err.message === "resubscribe" ? "Opnieuw verbonden, probeer nog eens" : "Versturen mislukt"); }
        b.disabled = false; b.textContent = "Stuur testmelding";
      }
    };
    el.onchange = e => {
      const nt = e.target.closest("[data-nudge-time]");
      if (nt && /^\d{2}:\d{2}$/.test(nt.value)) { prefs().nudgeTimes[nt.dataset.nudgeTime] = nt.value; Store.save(); scheduleSync(); toast("Tijd opgeslagen"); return; }
      const t = e.target.closest("[data-time]");
      if (t && /^\d{2}:\d{2}$/.test(t.value)) { prefs().reminders[t.dataset.time].time = t.value; Store.save(); scheduleSync(); toast("Tijd opgeslagen"); }
    };
  }

  /* Suggestion card on the home screen, only when it can actually work */
  function homeCardHtml() {
    const p = prefs();
    if (p.dismissed || status() !== "off") return "";
    return `<div class="card" data-anim style="margin-bottom:12px;display:flex;align-items:center;gap:12px;border-color:rgba(124,92,255,.45)">
      <span style="flex:1;min-width:0"><div style="font-weight:600">🔔 Herinneringen</div><div class="small muted">Ochtend, avond en op je risicomoment</div></span>
      <button class="btn sm" data-action="pushSetup">Aan</button>
      <button class="small muted" data-action="pushDismiss" aria-label="Sluiten" style="padding:6px">✕</button>
    </div>`;
  }

  // keep the server in sync when streak/name/reminders change
  const save = Store.save.bind(Store);
  Store.save = function () { save(); scheduleSync(); };

  window.Push = { mount, homeCardHtml, ensure, enable, sync, status, prefs };
})();
