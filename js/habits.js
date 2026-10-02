/* Habits with types: check (afvinken), count (tellen), timer, limit (minderen) and time (tijdstip).
   Values live in state.habitVal[day][habitId]; completion is mirrored in state.habitLog[day]
   so the discipline score, calendar and sync keep working.

   Behaviour design:
   - every habit can have an if-then plan: moment (anchor), cue ("Na mijn koffie"), place and a minimum version
   - a day can be marked "minimaal" (the small version counts as showing up) or "overgeslagen" with a reason,
     stored in state.habitStatus[day][habitId] = { s: "min" | "skip", why }
   - a weekly target (h.weekly, 1–7 days) and "nooit twee keer missen": one missed day never breaks the line
   - every 14 days four automaticity questions (SRBAI, 1–7); a habit that scores ≥ 5.5 can "graduate" (h.graduated):
     it moves to "Automatisch", gets no reminders or warnings and no longer counts as an active habit
   - reminders fade: daily → every other day → only after a miss → off, as the automaticity score grows */
(function () {
  const { $, $$, esc, haptic, toast, sheet } = FX;
  const DAY = Store.DAY;
  const S = () => Store.s;
  const today = () => Store.dayKey();

  const TYPES = {
    check: { label: "Afvinken", icon: "✓" },
    count: { label: "Tellen", icon: "＃" },
    timer: { label: "Timer", icon: "⏱" },
    limit: { label: "Limiet", icon: "↓" },
    time: { label: "Tijdstip", icon: "⏰" }
  };

  const TEMPLATES = [
    { cat: "Gezondheid", items: [
      { tpl: "water", e: "💧", t: "Water drinken", type: "count", target: 2000, unit: "ml", steps: [250, 500] },
      { tpl: "steps", e: "🚶", t: "Stappen", type: "count", target: 8000, unit: "stappen", steps: [1000, 2500] },
      { tpl: "veggies", e: "🥦", t: "Groente & fruit", type: "count", target: 5, unit: "porties", steps: [1] },
      { tpl: "sleep", e: "😴", t: "Slaap", type: "count", target: 8, unit: "uur", steps: [0.5, 1] },
      { tpl: "vitamins", e: "💊", t: "Vitamines", type: "check" },
      { tpl: "floss", e: "🦷", t: "Flossen", type: "check" }
    ] },
    { cat: "Kracht & beweging", items: [
      { tpl: "pushups", e: "💪", t: "Push-ups", type: "count", target: 50, unit: "reps", steps: [10, 5] },
      { tpl: "squats", e: "🦵", t: "Squats", type: "count", target: 50, unit: "reps", steps: [10, 20] },
      { tpl: "pullups", e: "🧗", t: "Pull-ups", type: "count", target: 20, unit: "reps", steps: [1, 5] },
      { tpl: "situps", e: "🔥", t: "Sit-ups", type: "count", target: 40, unit: "reps", steps: [10, 20] },
      { tpl: "plank", e: "🧱", t: "Plank", type: "timer", target: 3, unit: "min" },
      { tpl: "workout", e: "🏋️", t: "Sporten", type: "timer", target: 30, unit: "min" },
      { tpl: "cold", e: "🧊", t: "Koude douche", type: "check" }
    ] },
    { cat: "Mind & focus", items: [
      { tpl: "meditate", e: "🧘", t: "Mediteren", type: "timer", target: 10, unit: "min" },
      { tpl: "read", e: "📚", t: "Lezen", type: "timer", target: 20, unit: "min" },
      { tpl: "deepwork", e: "🎯", t: "Deep work", type: "timer", target: 60, unit: "min" },
      { tpl: "outside", e: "🌳", t: "Buiten zijn", type: "timer", target: 30, unit: "min" },
      { tpl: "learn", e: "🧠", t: "Iets nieuws leren", type: "timer", target: 15, unit: "min" },
      { tpl: "gratitude", e: "🙏", t: "Dankbaarheid", type: "count", target: 3, unit: "dingen", steps: [1] }
    ] },
    { cat: "Minderen", items: [
      { tpl: "screen", e: "📱", t: "Schermtijd", type: "limit", target: 120, unit: "min", steps: [15, 30] },
      { tpl: "social", e: "📲", t: "Social media", type: "limit", target: 30, unit: "min", steps: [5, 15] },
      { tpl: "coffee", e: "☕", t: "Koffie", type: "limit", target: 2, unit: "koppen", steps: [1] },
      { tpl: "sugar", e: "🍬", t: "Snoep & suiker", type: "limit", target: 1, unit: "keer", steps: [1] },
      { tpl: "alcohol", e: "🍺", t: "Alcohol", type: "limit", target: 0, unit: "drankjes", steps: [1] }
    ] },
    { cat: "Ritme", items: [
      { tpl: "wake", e: "⏰", t: "Vroeg opstaan", type: "time", target: 7 * 60 },
      { tpl: "bed", e: "🌙", t: "Op tijd naar bed", type: "time", target: 23 * 60 },
      { tpl: "nosnooze", e: "🔕", t: "Geen snooze", type: "check" },
      { tpl: "bedroom", e: "📵", t: "Telefoon uit de slaapkamer", type: "check" },
      { tpl: "makebed", e: "🛏️", t: "Bed opmaken", type: "check" }
    ] }
  ];
  const TPL = {}; TEMPLATES.forEach(c => c.items.forEach(i => { TPL[i.tpl] = i; }));

  /* Moments of the day a habit is anchored to; the home screen groups habits by these */
  const ANCHORS = [
    { id: "morning", e: "🌅", t: "Ochtend", from: 4, to: 12 },
    { id: "midday", e: "☀️", t: "Middag", from: 12, to: 17 },
    { id: "afterwork", e: "🏁", t: "Na werk", from: 17, to: 20 },
    { id: "evening", e: "🌙", t: "Avond", from: 20, to: 4 },
    { id: "any", e: "📌", t: "Hele dag" }
  ];
  const ANCHOR = Object.fromEntries(ANCHORS.map(a => [a.id, a]));
  function nowAnchor(d = new Date()) {
    const h = d.getHours();
    return ANCHORS.find(a => a.from != null && (a.from < a.to ? h >= a.from && h < a.to : h >= a.from || h < a.to)).id;
  }

  /* Sensible starting plans: moment + the smallest version that still counts */
  const PLAN = {
    water: ["any", "1 glas water"], steps: ["any", "Een rondje om het blok"], veggies: ["any", "1 stuk fruit"], sleep: ["evening", "Om 23:30 in bed"],
    vitamins: ["morning", ""], floss: ["evening", "1 tand flossen"],
    pushups: ["morning", "5 push-ups"], squats: ["morning", "10 squats"], pullups: ["afterwork", "1 pull-up"], situps: ["morning", "10 sit-ups"],
    plank: ["morning", "30 seconden"], workout: ["afterwork", "10 minuten bewegen"], cold: ["morning", "30 seconden koud aan het eind"],
    meditate: ["morning", "1 minuut ademen"], read: ["evening", "1 bladzijde"], deepwork: ["morning", "15 minuten zonder telefoon"],
    outside: ["midday", "5 minuten naar buiten"], learn: ["evening", "1 korte les"], gratitude: ["evening", "1 ding opschrijven"],
    screen: ["any", ""], social: ["any", ""], coffee: ["any", ""], sugar: ["any", ""], alcohol: ["any", ""],
    wake: ["morning", ""], bed: ["evening", ""], nosnooze: ["morning", ""], bedroom: ["evening", "Lader in de gang leggen"], makebed: ["morning", "Alleen het dekbed rechttrekken"]
  };
  const defaultPlan = tpl => { const p = PLAN[tpl] || ["any", ""]; return { anchor: p[0], cue: "", where: "", min: p[1] }; };
  const plan = h => Object.assign(defaultPlan(h.tpl), h.plan || {});

  const SKIP_REASONS = ["Geen tijd", "Vergeten", "Moe of ziek", "Geen zin", "Bewuste rustdag", "Anders"];

  /* Smart links: reaching a habit also ticks the matching Dopamine Reset task */
  const LINKS = { cold: ["cold", 1], meditate: ["meditate", 5], read: ["read", 15], workout: ["move", 20], outside: ["sun", 10], steps: ["move", 6000] };

  /* ---------- migration of old (typeless) habits ---------- */
  function migrate() {
    const s = S();
    s.habitVal = s.habitVal || {};
    s.habitTimer = s.habitTimer || {};
    let changed = false;
    s.habits = s.habits.map(h => {
      if (h.type) return h;
      changed = true;
      const base = h.id === "h1" && /push/i.test(h.t) ? TPL.pushups
        : h.id === "h2" && /water/i.test(h.t) ? TPL.water
        : h.id === "h3" && /dankbaar/i.test(h.t) ? TPL.gratitude : null;
      const created = s.firstStart || Date.now();
      if (!base) return Object.assign({ type: "check", created }, h);
      const n = Object.assign({}, base, { id: h.id, created });
      // carry over old check-offs as "target reached"
      Object.entries(s.habitLog).forEach(([d, ids]) => {
        if (ids.includes(h.id)) { (s.habitVal[d] = s.habitVal[d] || {})[h.id] = n.target; }
      });
      return n;
    });
    if (changed) Store.save();
  }

  /* ---------- values & completion ---------- */
  const get = id => S().habits.find(h => h.id === id);
  function val(h, day = today()) {
    const v = (S().habitVal[day] || {})[h.id];
    return v == null ? (h.type === "time" ? null : 0) : v;
  }
  function running(h) { return S().habitTimer[h.id] || null; }
  function liveVal(h, day = today()) {
    const r = running(h);
    return val(h, day) + (r && r.day === day ? (Date.now() - r.start) / 60000 : 0);
  }
  const timeOk = (v, target) => {
    if (v == null) return false;
    // bedtimes: 00:30 counts as later than 23:00
    if (target >= 18 * 60 && v < 12 * 60) v += 1440;
    return v <= target;
  };
  function isDone(h, day = today()) {
    const v = h.type === "timer" ? liveVal(h, day) : val(h, day);
    switch (h.type) {
      case "check": return (S().habitLog[day] || []).includes(h.id);
      case "count": case "timer": return v >= h.target;
      case "limit": return day >= Store.dayKey(h.created || 0) && v <= h.target;
      case "time": return timeOk(v, h.target);
    }
    return false;
  }
  function progress(h, day = today()) {
    if (h.type === "count" || h.type === "timer") return Math.min(1, (h.type === "timer" ? liveVal(h, day) : val(h, day)) / (h.target || 1));
    if (h.type === "limit") return h.target ? Math.min(1, val(h, day) / h.target) : (val(h, day) > 0 ? 1 : 0);
    return isDone(h, day) ? 1 : 0;
  }
  function over(h, day = today()) { return h.type === "limit" && val(h, day) > h.target; }

  /* ---------- check-in status, weekly target, never miss twice ---------- */
  function status(h, day = today()) { return ((S().habitStatus || {})[day] || {})[h.id] || null; }
  function setStatus(h, day, st) {
    const all = S().habitStatus || (S().habitStatus = {});
    const map = all[day] || (all[day] = {});
    if (st) map[h.id] = st; else delete map[h.id];
    if (!Object.keys(map).length) delete all[day];
    Store.save();
  }
  const canMin = h => h.type !== "limit";
  /* showed up: goal reached, or the minimum version was done */
  function shown(h, day = today()) { return isDone(h, day) || (canMin(h) && (status(h, day) || {}).s === "min"); }
  /* a consciously planned rest day is not a miss */
  const rested = (h, day) => { const st = status(h, day); return !!(st && st.s === "skip" && st.why === "Bewuste rustdag"); };
  const weekly = h => Math.min(7, Math.max(1, Math.round(h.weekly || 7)));
  const createdDay = h => Store.dayKey(h.created || 0);

  /* Monday of the week of ts, as a timestamp at noon (safe across DST) */
  function monday(ts = Date.now()) {
    const d = new Date(ts); d.setHours(12, 0, 0, 0);
    return d.getTime() - ((d.getDay() + 6) % 7) * DAY;
  }
  function weekDone(h, ts = Date.now()) {
    const m = monday(ts), end = Store.dayKey(ts) < today() ? Store.dayKey(m + 6 * DAY) : today();
    let n = 0;
    for (let i = 0; i < 7; i++) {
      const k = Store.dayKey(m + i * DAY);
      if (k > end) break;
      if (k >= createdDay(h) && shown(h, k)) n++;
    }
    return n;
  }
  function missed(h, day) { return day >= createdDay(h) && day < today() && !shown(h, day) && !rested(h, day); }
  /* Daily habits: yesterday was missed and today isn't done yet → today matters ("nooit twee keer missen") */
  function atRisk(h) {
    if (weekly(h) < 7 || h.type === "limit" || h.graduated) return false;
    return missed(h, Store.dayKey(Date.now() - DAY)) && !shown(h);
  }

  function mirror(h, day) {
    const log = S().habitLog;
    const arr = log[day] || (log[day] = []);
    const i = arr.indexOf(h.id), d = isDone(h, day);
    if (d && i < 0) arr.push(h.id);
    if (!d && i >= 0) arr.splice(i, 1);
  }

  function linkReset(h, day) {
    const l = LINKS[h.tpl];
    if (!l || day !== today()) return;
    const v = h.type === "check" ? (isDone(h, day) ? 1 : 0) : val(h, day);
    const list = S().reset[day] || (S().reset[day] = []);
    if (v >= l[1] && !list.includes(l[0])) { list.push(l[0]); toast("⚡ Dopamine Reset: " + DATA.resetTasks.find(t => t.id === l[0]).t + " afgevinkt"); }
  }

  /* Set a value and handle completion feedback */
  function setVal(h, day, v, { quiet } = {}) {
    const was = isDone(h, day), wasOver = over(h, day);
    const map = S().habitVal[day] || (S().habitVal[day] = {});
    if (v == null) delete map[h.id];
    else map[h.id] = h.type === "time" ? v : Math.max(0, Math.round(v * 100) / 100);
    mirror(h, day);
    linkReset(h, day);
    if (isDone(h, day) && status(h, day)) setStatus(h, day, null);
    Store.save();
    const now = isDone(h, day);
    // informational feedback, no prizes: the habit itself is the point (see docs/ontwerp.md, overjustification)
    if (!quiet && !was && now && h.type !== "limit") { Sound.success(); haptic([15, 40, 15]); toast(`${h.e} ${h.t}: ${h.type === "count" || h.type === "timer" ? fmt(h, val(h, day)) + " · " : ""}gedaan`); }
    if (!quiet && !wasOver && over(h, day)) { haptic([30, 60, 30]); toast(`${h.e} ${h.t}: limiet overschreden`); }
  }
  function toggleCheck(h, day = today()) {
    const on = Store.toggleIn("habitLog", h.id, day);
    if (on && status(h, day)) setStatus(h, day, null);
    linkReset(h, day);
    if (on) { Sound.toggle(true); haptic([10, 20, 10]); } else Sound.toggle(false);
    return on;
  }

  function startTimer(h) {
    S().habitTimer[h.id] = { start: Date.now(), day: today() };
    Store.save(); Sound.toggle(true); haptic();
  }
  function stopTimer(h) {
    const r = running(h); if (!r) return;
    delete S().habitTimer[h.id];
    setVal(h, r.day, val(h, r.day) + (Date.now() - r.start) / 60000);
    Sound.toggle(false);
  }

  /* Length of the current line. Daily habits: days shown up, where a single missed day is forgiven and only
     two misses in a row end the line. Weekly habits (fewer than 7 days): weeks in a row the target was reached. */
  function streak(h) {
    let n = 0;
    if (weekly(h) < 7) {
      const thisWeek = weekDone(h) >= weekly(h) ? 1 : 0;
      for (let w = 1; w < 60; w++) {
        const ts = monday() - w * 7 * DAY;
        if (Store.dayKey(ts + 6 * DAY) < createdDay(h)) break;
        if (weekDone(h, ts + 6 * DAY) >= weekly(h)) n++; else break;
      }
      return n + thisWeek;
    }
    let miss = 0;
    for (let i = 0; i < 400; i++) {
      const k = Store.dayKey(Date.now() - i * DAY);
      if (k < createdDay(h)) break;
      if (shown(h, k)) { n++; miss = 0; }
      else if (i === 0 || rested(h, k)) continue;
      else if (++miss >= 2) break;
    }
    return n;
  }
  const lineTxt = h => { const n = streak(h); return weekly(h) < 7 ? `${n} ${n === 1 ? "week" : "weken"}` : dagen(n); };
  function doneCount(day) { return S().habits.filter(h => isDone(h, day)).length; }

  /* ---------- formatting ---------- */
  const nf = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 });
  const nfL = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 2 });
  function fmt(h, v) {
    if (h.type === "time") return v == null ? "--:--" : String(Math.floor(v / 60) % 24).padStart(2, "0") + ":" + String(Math.round(v % 60)).padStart(2, "0");
    if (h.type === "timer") return nf.format(Math.floor(v)) + " min";
    if (h.unit === "ml" && (v >= 1000 || h.target >= 1000)) return nfL.format(v / 1000) + " L";
    return nf.format(v) + (h.unit ? " " + h.unit : "");
  }
  const fmtT = (h, v) => h.unit === "ml" && h.target >= 1000 ? nfL.format(v / 1000) : nf.format(v);
  const clock = min => { const s = Math.max(0, Math.floor(min * 60)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
  const dagen = n => n + (n === 1 ? " dag" : " dagen");
  const stepLabel = (h, st) => h.unit === "ml" ? (st >= 1000 ? "+" + nf.format(st / 1000) + " L" : "+" + st + " ml") : "+" + nf.format(st);

  function subText(h) {
    const st = isDone(h) ? null : status(h), p = plan(h);
    if (st && st.s === "skip") return `<span class="muted">Overgeslagen${st.why ? " · " + esc(st.why) : ""}</span>`;
    if (st && st.s === "min" && !isDone(h)) return `<span style="color:var(--ok)">½ Minimale versie gedaan</span>${weekTxt(h)}`;
    if (atRisk(h)) return baseSub(h) + `<div class="h-warn">Gisteren gemist${p.min ? " · minimaal " + esc(p.min.charAt(0).toLowerCase() + p.min.slice(1)) : " · vandaag telt"}</div>`;
    return baseSub(h) + weekTxt(h);
  }
  const weekTxt = h => weekly(h) < 7 ? ` · ${weekDone(h)}/${weekly(h)} deze week` : "";
  function baseSub(h) {
    const v = val(h), st = streak(h);
    const fire = st > 1 && weekly(h) === 7 ? ` · 🔗 ${st}` : "";
    switch (h.type) {
      case "check": return weekly(h) < 7 ? (isDone(h) ? "Gedaan vandaag" : "Nog niet gedaan") : dagen(st) + " volgehouden";
      case "count": return `${fmtT(h, v)} / ${fmt(h, h.target)}${fire}`;
      case "timer": {
        const r = running(h);
        return `<span data-h-live="${h.id}">${Math.floor(liveVal(h))}</span> / ${h.target} min${r ? ' · <b style="color:var(--ok)">loopt</b>' : ""}${fire}`;
      }
      case "limit": return over(h) ? `<span style="color:var(--danger)">${fmtT(h, v)} / max ${fmt(h, h.target)} · over limiet</span>` : `${fmtT(h, v)} / max ${fmt(h, h.target)}${fire}`;
      case "time": return v == null ? `Doel: ${h.tpl === "bed" || h.target >= 18 * 60 ? "voor" : "voor"} ${fmt(h, h.target)}${fire}` : `${fmt(h, v)} ${timeOk(v, h.target) ? "✓" : "✗"} · doel ${fmt(h, h.target)}${fire}`;
    }
    return "";
  }

  const R = 17, C = 2 * Math.PI * R;
  function ring(h, day = today()) {
    const done = isDone(h, day), bad = over(h, day), min = !done && shown(h, day);
    const p = min ? Math.max(0.5, progress(h, day)) : progress(h, day);
    const col = bad ? "var(--danger)" : h.type === "limit" ? "var(--warn)" : done || min ? "var(--ok)" : "url(#hg)";
    return `<span class="h-ring ${done ? "is-done" : ""}">
      <svg viewBox="0 0 40 40" width="40" height="40"><defs><linearGradient id="hg"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>
        <circle cx="20" cy="20" r="${R}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="3.5"/>
        <circle data-ring-p cx="20" cy="20" r="${R}" fill="none" stroke="${col}" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C * (1 - p)).toFixed(1)}" transform="rotate(-90 20 20)"/></svg>
      <span class="h-emo">${esc(h.e)}</span></span>`;
  }

  function actionHtml(h) {
    switch (h.type) {
      case "check": return `<button class="check" data-h-act="toggle" aria-label="Afvinken">${FX.checkIcon}</button>`;
      case "count": case "limit": return `<button class="h-plus" data-h-act="add" data-v="${h.steps[0]}">${stepLabel(h, h.steps[0])}</button>`;
      case "timer": return running(h) ? `<button class="h-plus on" data-h-act="timer">⏸ <span data-h-clock="${h.id}">${clock(liveVal(h) - val(h))}</span></button>` : `<button class="h-plus" data-h-act="timer">▶ Start</button>`;
      case "time": return val(h) == null ? `<button class="h-plus" data-h-act="now">Nu</button>` : `<button class="h-plus ghost" data-h-act="open">${fmt(h, val(h))}</button>`;
    }
    return "";
  }

  /* ---------- automaticity (SRBAI) and graduation ---------- */
  const SRBAI = [
    "Ik doe het automatisch.",
    "Ik doe het zonder er bewust aan te denken.",
    "Ik doe het voordat ik doorheb dat ik ermee bezig ben.",
    "Het zou raar voelen om het níet te doen."
  ];
  const AUTO_EVERY = 14 * DAY, AUTO_GRAD = 5.5, AUTO_MID = 3.5;
  const active = () => S().habits.filter(h => !h.graduated);
  const lastAuto = h => (h.srbai || [])[(h.srbai || []).length - 1] || null;
  function autoDue(h, now = Date.now()) {
    if (h.graduated || h.type === "limit") return false;
    if (now - (h.created || 0) < AUTO_EVERY) return false;
    if (h.autoSnooze && now < h.autoSnooze) return false;
    const l = lastAuto(h);
    return !l || now - l.ts >= AUTO_EVERY;
  }
  const nextAutoDue = () => active().find(h => autoDue(h)) || null;

  /* Reminder level, fading with automaticity */
  function reminderLevel(h) {
    if (h.graduated) return { id: "off", t: "uit · gaat vanzelf" };
    if (h.type === "limit" || h.type === "time" || plan(h).anchor === "any") return { id: "none", t: "geen · geen vast moment" };
    const l = lastAuto(h);
    if (l && l.score >= AUTO_GRAD) return { id: "aftermiss", t: "alleen na een gemiste dag" };
    if (l && l.score >= AUTO_MID) return { id: "alternate", t: "om de dag" };
    return { id: "daily", t: "elke dag" };
  }
  /* Should habit h get a nudge on day k (today or tomorrow)? */
  function wantsNudge(h, k) {
    const lvl = reminderLevel(h).id, t = today();
    if (lvl === "off" || lvl === "none" || k < createdDay(h)) return false;
    if (k === t && (shown(h, t) || status(h, t))) return false;
    if (weekly(h) < 7 && weekDone(h) >= weekly(h) && monday(Date.parse(k + "T12:00:00")) === monday()) return false;
    const prev = Store.dayKey(Date.parse(k + "T12:00:00") - DAY);
    const missedPrev = prev === t ? !shown(h, t) : missed(h, prev);
    if (lvl === "daily") return true;
    if (lvl === "alternate") return Math.floor(Date.parse(k + "T12:00:00") / DAY) % 2 === 0 || missedPrev;
    return missedPrev; // aftermiss
  }
  /* Per moment of the day: which habits to nudge today and tomorrow (sent to the push server) */
  function nudges() {
    const t = today(), tm = Store.dayKey(Date.now() + DAY), out = {};
    ANCHORS.filter(a => a.id !== "any").forEach((a, i) => {
      const days = {};
      [t, tm].forEach(k => {
        const list = active().filter(h => plan(h).anchor === a.id && wantsNudge(h, k));
        if (!list.length) return;
        const one = list[0], p = plan(one);
        days[k] = list.length === 1
          ? { title: `${a.e} ${p.cue ? p.cue.charAt(0).toUpperCase() + p.cue.slice(1) : a.t}: ${one.t.toLowerCase()}`, body: p.min ? `Klein beginnen mag: ${p.min}.` : "Even doen, dan staat het." }
          : { title: `${a.e} ${a.t}: ${list.length} gewoontes`, body: list.map(h => h.e + " " + h.t + (plan(h).min ? " (min. " + plan(h).min + ")" : "")).join(" · ").slice(0, 150) };
      });
      if (Object.keys(days).length) out["n" + i] = days;
    });
    return out;
  }

  function autoSheet(id) {
    const h = get(id) || nextAutoDue(); if (!h) return;
    const ans = [0, 0, 0, 0];
    const scale = i => `<div class="auto-scale" data-q="${i}">${[1, 2, 3, 4, 5, 6, 7].map(n => `<button data-v="${n}">${n}</button>`).join("")}</div>`;
    sheet(`
      <div class="eyebrow">Automatisme-check · elke 14 dagen</div>
      <h2>${esc(h.e)} ${esc(h.t)}</h2>
      <p class="sub">Hoe vanzelfsprekend is deze gewoonte nu? 1 = helemaal niet mee eens, 7 = helemaal mee eens.</p>
      ${SRBAI.map((q, i) => `<label class="lbl" style="text-transform:none;letter-spacing:0;font-size:15px;color:#fff">${q}</label>${scale(i)}`).join("")}
      <div class="row between small muted" style="margin-top:6px"><span>niet mee eens</span><span>mee eens</span></div>
      <div data-auto-out></div>
      <div data-actions><div style="margin-top:22px"><button class="btn" data-save disabled>Opslaan</button></div>
      <div style="margin-top:10px"><button class="btn ghost" data-later>Later</button></div></div>`, {
      onClose() { if (window.App) App.refresh(false); },
      onMount(sh, close) {
        const save = $("[data-save]", sh);
        sh.addEventListener("click", e => {
          const b = e.target.closest(".auto-scale button");
          if (b) {
            const q = +b.closest("[data-q]").dataset.q; ans[q] = +b.dataset.v;
            $$(`[data-q="${q}"] button`, sh).forEach(x => x.classList.toggle("on", x === b));
            haptic(); Sound.tap(); save.disabled = ans.some(a => !a); return;
          }
          if (e.target.closest("[data-later]")) { h.autoSnooze = Date.now() + 2 * DAY; Store.save(); close(); return; }
          if (e.target.closest("[data-grad]")) { h.graduated = Date.now(); Store.save(); Sound.success(); toast(`${h.e} ${h.t} staat nu bij Automatisch`); close(); return; }
          if (e.target.closest("[data-keep]")) { close(); return; }
          if (e.target.closest("[data-save]") && !save.disabled) {
            const score = Math.round(ans.reduce((a, b) => a + b, 0) / 4 * 10) / 10;
            (h.srbai = h.srbai || []).push({ ts: Date.now(), score });
            delete h.autoSnooze; Store.save(); haptic([10, 20, 10]);
            const lvl = reminderLevel(h);
            $("[data-auto-out]", sh).innerHTML = `<div class="card" style="margin-top:18px">
              <div class="eyebrow">Score ${String(score).replace(".", ",")} / 7</div>
              <div style="font-weight:600;margin-top:6px">${score >= AUTO_GRAD ? "Dit gaat vanzelf. Klaar om af te studeren?" : score >= AUTO_MID ? "Het wordt een gewoonte. Herinneringen worden minder." : "Nog bewust werk. Dat is normaal in deze fase."}</div>
              <p class="small muted" style="margin-top:6px">Herinneringen: ${lvl.t}. Gemiddeld duurt het ruim 2 maanden voor iets automatisch gaat, met grote verschillen per persoon.</p>
              </div>`;
            $("[data-actions]", sh).innerHTML = score >= AUTO_GRAD
              ? `<div style="margin-top:18px"><button class="btn" data-grad>🎓 Ja, het gaat vanzelf</button></div><div style="margin-top:10px"><button class="btn ghost" data-keep>Nog even volgen</button></div>`
              : `<div style="margin-top:18px"><button class="btn" data-keep>Sluiten</button></div>`;
          }
        });
      }
    });
  }

  function autoCardHtml() {
    const h = nextAutoDue();
    if (!h) return "";
    return `<button class="card tap" data-auto="${h.id}" data-anim style="width:100%;text-align:left;display:flex;gap:12px;align-items:center;margin-top:12px">
      <span style="font-size:24px">🧠</span><span style="flex:1;min-width:0"><div style="font-weight:600">Gaat ${esc(h.t.toLowerCase())} al vanzelf?</div><div class="small muted">4 korte vragen · bepaalt hoe vaak je herinnerd wordt</div></span><span class="muted">›</span></button>`;
  }

  /* Starting with 1–3 habits at a time works best; graduated ones don't count */
  function tooManyHtml() {
    const n = active().length;
    if (n < 3) return "";
    return `<div class="card" style="margin-bottom:12px;border-color:rgba(251,191,36,.45)"><div style="font-weight:600">⚖️ Je volgt al ${n} gewoontes</div>
      <p class="small muted" style="margin-top:4px">Nieuwe gewoontes lukken het best met 1 tot 3 tegelijk. Overweeg te wachten tot een gewoonte automatisch gaat (zie de check elke 14 dagen) voor je er een bij neemt.</p></div>`;
  }

  function rowHtml(h) {
    const done = isDone(h);
    return `<div class="list-item habit ${done && h.type === "check" ? "done" : ""} ${done ? "h-done" : ""}" data-habit="${h.id}">
      ${ring(h)}
      <span class="li-body" data-h-act="open"><div class="li-title">${esc(h.t)}</div><div class="li-sub">${subText(h)}</div></span>
      ${actionHtml(h)}
    </div>`;
  }

  /* Today: grouped by moment of the day (only when at least one habit has a moment other than "Hele dag") */
  function listHtml() {
    const s = S();
    if (!s.habits.length) return `<div class="empty">Nog geen gewoontes. <button class="link" style="color:var(--accent2)" data-action="habits">Voeg er een toe</button></div>`;
    const act = active(), grad = s.habits.filter(h => h.graduated);
    const groups = ANCHORS.map(a => ({ a, list: act.filter(h => (ANCHOR[plan(h).anchor] ? plan(h).anchor : "any") === a.id) })).filter(g => g.list.length);
    const gradHtml = grad.length ? `<div class="h-group" data-anchor="auto"><span>🎓 Automatisch</span><span>${grad.filter(h => shown(h)).length}/${grad.length}</span></div>${grad.map(rowHtml).join("")}` : "";
    if (groups.length <= 1 && (!groups.length || groups[0].a.id === "any")) return (groups.length ? `${grad.length ? '<div class="h-group" data-anchor="any"><span>📌 Hele dag</span><span></span></div>' : ""}${groups[0].list.map(rowHtml).join("")}` : "") + gradHtml;
    const cur = nowAnchor();
    return groups.map(g => {
      const left = g.list.filter(h => !shown(h) && !status(h)).length;
      return `<div class="h-group ${g.a.id === cur ? "now" : ""}" data-anchor="${g.a.id}"><span>${g.a.e} ${g.a.t}${g.a.id === cur ? " <b>· nu</b>" : ""}</span><span>${left ? left + " te gaan" : "✓"}</span></div>${g.list.map(rowHtml).join("")}`;
    }).join("") + gradHtml;
  }

  /* Re-render one row in place (with a little pop on the ring) */
  function refreshRow(root, h) {
    const old = root.querySelector(`[data-habit="${h.id}"]`); if (!old) return;
    const oldOff = parseFloat(old.querySelector("[data-ring-p]").getAttribute("stroke-dashoffset"));
    const tmp = document.createElement("div"); tmp.innerHTML = rowHtml(h);
    const row = tmp.firstElementChild; old.replaceWith(row);
    const p = row.querySelector("[data-ring-p]"), to = parseFloat(p.getAttribute("stroke-dashoffset"));
    if (oldOff !== to) gsap.fromTo(p, { attr: { "stroke-dashoffset": oldOff } }, { attr: { "stroke-dashoffset": to }, duration: 0.6, ease: "power3.out" });
    gsap.fromTo(row.querySelector(".h-ring"), { scale: 0.88 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
  }

  /* Delegated clicks for habit rows (home screen) */
  function handleClick(e, root) {
    const row = e.target.closest("[data-habit]"); if (!row) return false;
    const h = get(row.dataset.habit); if (!h) return true;
    const act = (e.target.closest("[data-h-act]") || {}).dataset?.hAct || "open";
    if (act === "open") { haptic(); Sound.tap(); openHabit(h.id); return true; }
    if (act === "toggle") toggleCheck(h);
    if (act === "add") { haptic(8); Sound.tap(); setVal(h, today(), val(h) + +e.target.closest("[data-v]").dataset.v); }
    if (act === "timer") running(h) ? stopTimer(h) : startTimer(h);
    if (act === "now") { const d = new Date(); setVal(h, today(), d.getHours() * 60 + d.getMinutes()); }
    refreshRow(root, h);
    return true;
  }

  /* ---------- live timers ---------- */
  let lastTick = 0;
  setInterval(() => {
    rollover();
    const runningHabits = S().habits.filter(running);
    if (!runningHabits.length) return;
    runningHabits.forEach(h => {
      const lv = liveVal(h);
      $$(`[data-h-live="${h.id}"]`).forEach(el => el.textContent = Math.floor(lv));
      $$(`[data-h-clock="${h.id}"]`).forEach(el => el.textContent = clock(lv - val(h)));
      $$(`[data-h-big="${h.id}"]`).forEach(el => el.textContent = clock(lv));
      // celebrate the moment a running timer reaches its goal
      if (!h._celebrated && val(h) < h.target && lv >= h.target && Date.now() - lastTick > 500) {
        h._celebrated = true; Sound.success(); haptic([15, 40, 15]); toast(`${h.e} ${h.t}: ${h.target} min gehaald!`);
      }
    });
    lastTick = Date.now();
  }, 1000);

  /* ---------- detail sheet ---------- */
  function history(h, days = 7) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY), k = Store.dayKey(d);
      out.push({ k, l: ["Z", "M", "D", "W", "D", "V", "Z"][d.getDay()], v: h.type === "timer" ? liveVal(h, k) : val(h, k), p: progress(h, k), done: isDone(h, k), over: over(h, k), today: i === 0 });
    }
    return out;
  }

  function historyHtml(h) {
    const hist = history(h);
    return `<div class="h-hist">${hist.map(d => `
      <div class="h-col ${d.today ? "today" : ""}"><div class="h-bar"><i style="height:${Math.max(4, d.p * 100)}%;background:${d.over ? "var(--danger)" : d.done ? "var(--ok)" : "var(--accent)"}"></i></div><span>${d.l}</span></div>`).join("")}</div>`;
  }

  function statsHtml(h) {
    const hist = history(h);
    const hit = hist.filter(d => d.done).length;
    let extra = "";
    if (h.type === "count" || h.type === "timer" || h.type === "limit") {
      const tot = hist.reduce((a, d) => a + (d.v || 0), 0);
      extra = `<div><b>${h.type === "timer" ? Math.round(tot) : fmtT(h, tot)}</b><span>${h.type === "timer" ? "min" : (h.unit === "ml" && h.target >= 1000 ? "L" : h.unit)} deze week</span></div><div><b>${h.type === "timer" ? Math.round(tot / 7) : fmtT(h, Math.round(tot / 7 * 10) / 10)}</b><span>gem. per dag</span></div>`;
    }
    const st = streak(h), wk = weekly(h) < 7;
    return `<div class="h-stats"><div><b>🔗 ${st}</b><span>${wk ? (st === 1 ? "week" : "weken") + " weekdoel" : (st === 1 ? "dag" : "dagen") + " volgehouden"}</span></div><div><b>${wk ? weekDone(h) + "/" + weekly(h) : hit + "/7"}</b><span>${wk ? "deze week" : "gehaald"}</span></div>${extra}</div>`;
  }

  function statusHtml(h, day) {
    if (!canMin(h) || isDone(h, day)) return "";
    const st = status(h, day) || {}, p = plan(h);
    return `<label class="lbl">Lukt het niet helemaal?</label>
      <div class="seg" data-status><button class="${st.s === "min" ? "on" : ""}" data-st="min">½ Minimale versie</button><button class="${st.s === "skip" ? "on" : ""}" data-st="skip">Overslaan</button></div>
      ${st.s === "min" ? `<p class="small muted" style="margin-top:8px">Telt als komen opdagen${p.min ? ` (${esc(p.min)})` : ""}. Klein doen houdt de gewoonte levend.</p>` : ""}
      ${st.s === "skip" ? `<div class="chips" style="margin-top:10px" data-why>${SKIP_REASONS.map(r => `<button class="chip ${st.why === r ? "on" : ""}" data-v="${r}">${r}</button>`).join("")}</div>
        <p class="small muted" style="margin-top:8px">${weekly(h) < 7 ? "Je weekdoel is " + weekly(h) + " dagen, dus een dag overslaan kan." : "Eén keer missen is menselijk. Zorg dat het niet twee keer op rij gebeurt."}</p>` : ""}`;
  }

  /* The if-then plan as one sentence: "Na mijn koffie, in de keuken: Push-ups. Minimaal: 5 push-ups" */
  function planText(h) {
    const p = plan(h);
    if (!p.cue && !p.where) return "";
    const up = x => x.charAt(0).toUpperCase() + x.slice(1), low = x => x.charAt(0).toLowerCase() + x.slice(1);
    return `${esc(up(p.cue || ANCHOR[p.anchor].t))}${p.where ? ", " + esc(low(p.where)) : ""}: ${esc(h.t.toLowerCase())}`;
  }
  function planHtml(h) {
    const p = plan(h), txt = planText(h);
    if (!txt) return `<button class="card tap" data-edit style="width:100%;text-align:left;margin-top:16px;display:flex;gap:12px;align-items:center;border-style:dashed">
      <span style="font-size:22px">🧭</span><span><div style="font-weight:600">Maak een als-dan-plan</div><div class="small muted">Wanneer, waar en wat is de kleinste versie? Dat verdubbelt de kans dat je het doet.</div></span></button>`;
    return `<div class="card" style="margin-top:16px"><div class="eyebrow">Mijn plan · ${ANCHOR[p.anchor].e} ${ANCHOR[p.anchor].t}${weekly(h) < 7 ? " · " + weekly(h) + "× per week" : ""}</div>
      <div style="margin-top:6px;font-weight:600">${txt}</div>${p.min ? `<div class="small muted" style="margin-top:4px">Minimaal: ${esc(p.min)}</div>` : ""}</div>`;
  }

  function autoHtml(h) {
    const l = lastAuto(h), lvl = reminderLevel(h);
    const hist = (h.srbai || []).slice(-6).map(x => `<i style="height:${(x.score / 7) * 100}%"></i>`).join("");
    return `<div class="card" style="margin-top:12px">
      <div class="row between"><div class="eyebrow">Automatisme</div>${h.graduated ? `<button class="link small" data-ungrad>Terug naar actief</button>` : h.type === "limit" ? "" : `<button class="link small" data-auto-now>Check nu</button>`}</div>
      <div style="font-weight:600;margin-top:6px">${h.graduated ? "🎓 Gaat vanzelf" : l ? `${String(l.score).replace(".", ",")} / 7 · ${l.score >= AUTO_GRAD ? "bijna automatisch" : l.score >= AUTO_MID ? "wordt een gewoonte" : "nog bewust werk"}` : h.type === "limit" ? "Niet van toepassing bij een limiet" : "Eerste check na 14 dagen"}</div>
      ${hist ? `<div class="auto-hist">${hist}</div>` : ""}
      <div class="small muted" style="margin-top:6px">🔔 Herinnering: ${lvl.t}</div></div>`;
  }

  function openHabit(id, dayArg) {
    const h = get(id); if (!h) return;
    let day = dayArg || today();
    const yday = Store.dayKey(Date.now() - DAY);

    const body = () => {
      const v = val(h, day);
      let ctl = "";
      if (h.type === "count" || h.type === "limit") {
        ctl = `<div class="h-big"><span data-big>${fmtT(h, v)}</span><small>/ ${h.type === "limit" ? "max " : ""}${fmt(h, h.target)}</small></div>
          <div class="bar" style="margin:6px 0 18px"><i data-bar style="width:${progress(h, day) * 100}%;${over(h, day) ? "background:var(--danger)" : ""}"></i></div>
          <div class="h-steps"><button class="h-step" data-add="${-h.steps[0]}">${stepLabel(h, h.steps[0]).replace("+", "−")}</button>${h.steps.map(st => `<button class="h-step pri" data-add="${st}">${stepLabel(h, st)}</button>`).join("")}</div>
          <div class="row" style="margin-top:14px"><input class="field" type="number" inputmode="decimal" data-manual placeholder="Precies invullen (${h.unit === "ml" ? "ml" : h.unit || "aantal"})"><button class="btn sm" data-set>Zet</button></div>`;
      } else if (h.type === "timer") {
        const r = running(h);
        ctl = `<div class="h-big"><span data-h-big="${h.id}">${clock(liveVal(h, day))}</span><small>/ ${h.target} min</small></div>
          <div class="bar" style="margin:6px 0 18px"><i style="width:${progress(h, day) * 100}%"></i></div>
          ${day === today() ? `<button class="btn ${r ? "danger" : ""}" data-timer>${r ? "⏸ Stop timer" : "▶ Start timer"}</button>` : ""}
          <div class="h-steps" style="margin-top:12px"><button class="h-step" data-add="-5">−5 min</button><button class="h-step pri" data-add="5">+5 min</button><button class="h-step pri" data-add="10">+10 min</button><button class="h-step pri" data-add="${h.target}">+${h.target} min</button></div>`;
      } else if (h.type === "time") {
        ctl = `<div class="h-big"><span data-big>${fmt(h, v)}</span><small>doel: voor ${fmt(h, h.target)}</small></div>
          <div class="row" style="margin-top:16px"><input class="field time-in" style="flex:1;padding:14px;font-size:18px" type="time" data-time value="${v == null ? "" : fmt(h, v)}"><button class="btn sm" data-now>Nu</button></div>
          ${v != null ? `<button class="small muted" data-clear style="margin-top:10px">Wissen</button>` : ""}`;
      } else {
        const d = isDone(h, day);
        ctl = `<button class="btn ${d ? "ok" : ""}" data-check style="height:64px;font-size:18px">${d ? "✓ Gedaan" : "Markeer als gedaan"}</button>`;
      }
      return `
        <div class="row" style="gap:14px;margin-bottom:16px">${ring(h, day)}<div style="flex:1"><h2 style="margin:0">${esc(h.t)}</h2><div class="small muted">${TYPES[h.type].label}${h.type === "check" ? "" : " · doel " + (h.type === "limit" ? "max " : "") + fmt(h, h.target)}</div></div><button class="btn ghost sm" data-edit>Wijzig</button></div>
        <div class="seg" data-day-seg style="margin-bottom:18px"><button class="${day === today() ? "on" : ""}" data-d="${today()}">Vandaag</button><button class="${day === yday ? "on" : ""}" data-d="${yday}">Gisteren</button></div>
        ${ctl}
        ${statusHtml(h, day)}
        ${planHtml(h)}
        ${autoHtml(h)}
        <label class="lbl">Laatste 7 dagen</label>
        ${historyHtml(h)}
        ${statsHtml(h)}`;
    };

    sheet(`<div data-hbody>${body()}</div>`, {
      onClose() { if (window.App) App.refresh(false); },
      onMount(sh, close) {
        const wrap = $("[data-hbody]", sh);
        const redraw = () => { wrap.innerHTML = body(); };
        wrap.addEventListener("click", e => {
          const t = e.target;
          const dd = t.closest("[data-d]");
          if (dd) { day = dd.dataset.d; haptic(); Sound.tap(); redraw(); return; }
          if (t.closest("[data-edit]")) { const toPlan = !!t.closest(".card"); close(); setTimeout(() => editHabit(h.id, null, { focusPlan: toPlan }), 320); return; }
          const add = t.closest("[data-add]");
          if (add) {
            haptic(8); Sound.tap();
            setVal(h, day, val(h, day) + +add.dataset.add);
            redraw();
            const nb = $("[data-big]", wrap) || $(`[data-h-big]`, wrap);
            if (nb) gsap.fromTo(nb, { scale: 1.12 }, { scale: 1, duration: 0.45, ease: "back.out(3)" });
            return;
          }
          if (t.closest("[data-set]")) {
            const inp = $("[data-manual]", wrap), n = parseFloat(String(inp.value).replace(",", "."));
            if (!Number.isFinite(n)) return;
            setVal(h, day, n); redraw(); return;
          }
          if (t.closest("[data-timer]")) { running(h) ? stopTimer(h) : startTimer(h); redraw(); return; }
          if (t.closest("[data-now]")) { const d = new Date(); setVal(h, day, d.getHours() * 60 + d.getMinutes()); redraw(); return; }
          if (t.closest("[data-clear]")) { setVal(h, day, null); redraw(); return; }
          if (t.closest("[data-check]")) { toggleCheck(h, day); redraw(); return; }
          if (t.closest("[data-auto-now]")) { close(); setTimeout(() => autoSheet(h.id), 320); return; }
          if (t.closest("[data-ungrad]")) { delete h.graduated; h.autoSnooze = Date.now() + 7 * DAY; Store.save(); toast(`${h.e} ${h.t} staat weer bij actief`); redraw(); return; }
          const sb = t.closest("[data-st]");
          if (sb) {
            const cur = status(h, day), v = sb.dataset.st;
            setStatus(h, day, cur && cur.s === v ? null : { s: v });
            haptic(); Sound.tap();
            if (v === "min" && !(cur && cur.s === "min")) { Sound.success(); toast(`${h.e} Minimale versie gelogd · klein telt ook`); }
            redraw(); return;
          }
          const why = t.closest("[data-why] [data-v]");
          if (why) { setStatus(h, day, { s: "skip", why: why.dataset.v }); haptic(); Sound.tap(); redraw(); return; }
        });
        wrap.addEventListener("change", e => {
          if (e.target.matches("[data-time]") && e.target.value) {
            const [hh, mm] = e.target.value.split(":").map(Number);
            setVal(h, day, hh * 60 + mm); redraw();
          }
        });
      }
    });
  }

  /* ---------- editor (new from template / custom / edit existing) ---------- */
  function editHabit(id, preset, { focusPlan } = {}) {
    const existing = id ? get(id) : null;
    const h = Object.assign({ e: "⭐", t: "", type: "count", target: 10, unit: "", steps: [1] }, preset || {}, existing || {});
    let type = h.type;
    const p0 = plan(h);
    let anchor = p0.anchor, perWeek = weekly(h);
    const fieldsHtml = () => {
      if (type === "check") return `<p class="small muted" style="margin-top:14px">Afvinken: gedaan of niet gedaan.</p>`;
      if (type === "time") return `<label class="lbl">Doel: voor dit tijdstip</label><input class="field" type="time" data-target-time value="${fmt({ type: "time" }, h.type === "time" ? h.target : 7 * 60)}">`;
      const tl = type === "limit" ? "Maximum per dag" : type === "timer" ? "Doel (minuten per dag)" : "Doel per dag";
      return `<div class="grid2"><div><label class="lbl">${tl}</label><input class="field" type="number" inputmode="decimal" data-target value="${type === h.type ? h.target : type === "timer" ? 20 : 10}"></div>
        ${type === "timer" ? "" : `<div><label class="lbl">Eenheid</label><input class="field" data-unit value="${esc(h.unit || "")}" placeholder="bijv. reps, ml"></div>`}</div>
        ${type === "timer" ? "" : `<label class="lbl">Snelknoppen (komma's)</label><input class="field" data-steps value="${(h.steps || [1]).join(", ")}" placeholder="bijv. 250, 500">`}`;
    };
    sheet(`
      <h2>${existing ? "Gewoonte wijzigen" : "Eigen gewoonte"}</h2>
      ${existing ? "" : tooManyHtml()}
      <div class="row" style="margin-top:12px"><input class="field" data-emoji maxlength="4" style="width:66px;text-align:center;font-size:22px" value="${esc(h.e)}"><input class="field" data-name placeholder="Naam" value="${esc(h.t)}"></div>
      <label class="lbl">Soort</label>
      <div class="seg" data-type>${Object.entries(TYPES).map(([k, t]) => `<button data-v="${k}" class="${k === type ? "on" : ""}">${t.label}</button>`).join("")}</div>
      <div data-fields>${fieldsHtml()}</div>
      <label class="lbl" data-plan-lbl>Als-dan-plan</label>
      <div class="seg" data-anchor-seg>${ANCHORS.map(a => `<button data-v="${a.id}" class="${a.id === anchor ? "on" : ""}" style="font-size:12px">${a.t}</button>`).join("")}</div>
      <div class="small muted" style="margin:12px 0 6px">Wanneer: na …</div>
      <input class="field" data-cue maxlength="60" value="${esc(p0.cue)}" placeholder="bijv. Na mijn koffie">
      <div class="small muted" style="margin:12px 0 6px">Waar</div>
      <input class="field" data-where maxlength="40" value="${esc(p0.where)}" placeholder="bijv. In de keuken">
      <div class="small muted" style="margin:12px 0 6px">Minimale versie</div>
      <input class="field" data-min maxlength="60" value="${esc(p0.min)}" placeholder="bijv. 5 push-ups">
      <p class="small muted" style="margin-top:8px">Koppel het aan iets wat je al elke dag doet. De minimale versie is wat je doet op een slechte dag.</p>
      <div data-weekly-wrap ${type === "limit" ? 'style="display:none"' : ""}>
        <label class="lbl">Hoe vaak per week</label>
        <div class="seg" data-weekly>${[2, 3, 4, 5, 6, 7].map(n => `<button data-v="${n}" class="${n === perWeek ? "on" : ""}">${n === 7 ? "Elke dag" : n + "×"}</button>`).join("")}</div>
      </div>
      <div style="margin-top:22px"><button class="btn" data-save>${existing ? "Opslaan" : "Toevoegen"}</button></div>
      ${existing ? `<div style="margin-top:10px"><button class="btn ghost" data-del style="color:var(--danger)">Verwijderen</button></div>` : ""}`, {
      onMount(sh, close) {
        $("[data-type]", sh).addEventListener("click", e => {
          const b = e.target.closest("button"); if (!b) return;
          type = b.dataset.v; $$("[data-type] button", sh).forEach(x => x.classList.toggle("on", x === b));
          $("[data-fields]", sh).innerHTML = fieldsHtml(); haptic(); Sound.tap();
          $("[data-weekly-wrap]", sh).style.display = type === "limit" ? "none" : "";
        });
        const pickSeg = (sel, cb) => $(sel, sh).addEventListener("click", e => {
          const b = e.target.closest("button"); if (!b) return;
          $$(sel + " button", sh).forEach(x => x.classList.toggle("on", x === b)); cb(b.dataset.v); haptic(); Sound.tap();
        });
        pickSeg("[data-anchor-seg]", v => { anchor = v; });
        pickSeg("[data-weekly]", v => { perWeek = +v; });
        if (focusPlan) setTimeout(() => { $("[data-plan-lbl]", sh).scrollIntoView({ block: "start", behavior: "smooth" }); $("[data-cue]", sh).focus({ preventScroll: true }); }, 450);
        $("[data-save]", sh).addEventListener("click", () => {
          const name = $("[data-name]", sh).value.trim();
          if (!name) { gsap.fromTo($("[data-name]", sh), { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" }); return; }
          const out = { id: existing ? existing.id : "h" + Date.now(), e: $("[data-emoji]", sh).value.trim() || "⭐", t: name, type, tpl: h.tpl, created: existing ? existing.created : Date.now(),
            plan: { anchor, cue: $("[data-cue]", sh).value.trim(), where: $("[data-where]", sh).value.trim(), min: $("[data-min]", sh).value.trim() },
            weekly: type === "limit" ? 7 : perWeek };
          if (type === "time") { const [a, b] = ($("[data-target-time]", sh).value || "07:00").split(":").map(Number); out.target = a * 60 + b; }
          else if (type !== "check") {
            out.target = Math.max(0, parseFloat(String($("[data-target]", sh).value).replace(",", ".")) || 1);
            out.unit = type === "timer" ? "min" : ($("[data-unit]", sh).value || "").trim();
            out.steps = type === "timer" ? [5] : ($("[data-steps]", sh).value || "1").split(/[,; ]+/).map(x => parseFloat(x.replace(",", "."))).filter(x => x > 0).slice(0, 3);
            if (!out.steps.length) out.steps = [1];
          }
          const list = S().habits;
          const i = list.findIndex(x => x.id === out.id);
          if (i >= 0) list[i] = out; else list.push(out);
          Object.keys(S().habitLog).forEach(d => mirror(out, d));
          Store.save(); close(); Sound.success();
          toast(existing ? "Gewoonte bijgewerkt" : `${out.e} ${out.t} toegevoegd`);
          if (window.App) App.refresh(false);
        });
        const del = $("[data-del]", sh);
        if (del) del.addEventListener("click", () => {
          if (del.dataset.sure !== "1") { del.dataset.sure = "1"; del.textContent = "Zeker weten? Tik nogmaals"; haptic([10, 30, 10]); return; }
          S().habits = S().habits.filter(x => x.id !== existing.id);
          delete S().habitTimer[existing.id];
          Store.save(); close(); toast("Gewoonte verwijderd");
          if (window.App) App.refresh(false);
        });
      }
    });
  }

  /* ---------- template picker ---------- */
  function addSheet() {
    const have = new Set(S().habits.map(h => h.tpl).filter(Boolean));
    sheet(`
      <h2>Gewoonte toevoegen</h2>
      <p class="sub">Kies een kant-en-klare gewoonte of maak er zelf een.</p>
      ${tooManyHtml()}
      <button class="card tap" data-custom style="width:100%;text-align:left;display:flex;gap:14px;align-items:center;margin-bottom:6px;border-color:rgba(124,92,255,.45)">
        <span style="font-size:26px">✏️</span><span><div style="font-weight:600">Eigen gewoonte</div><div class="small muted">Tellen, timer, limiet, tijdstip of afvinken</div></span></button>
      ${TEMPLATES.map(c => `
        <label class="lbl">${c.cat}</label>
        <div class="tpl-grid">${c.items.map(i => `
          <button class="tpl ${have.has(i.tpl) ? "have" : ""}" data-tpl="${i.tpl}">
            <span class="tpl-e">${i.e}</span><span class="tpl-t">${i.t}</span>
            <span class="tpl-s">${have.has(i.tpl) ? "✓ Toegevoegd" : TYPES[i.type].label + (i.type === "check" ? "" : " · " + (i.type === "limit" ? "max " : "") + fmt(i, i.target))}</span>
          </button>`).join("")}</div>`).join("")}`, {
      onMount(sh, close) {
        $("[data-custom]", sh).addEventListener("click", () => { close(); setTimeout(() => editHabit(null), 320); });
        sh.addEventListener("click", e => {
          const b = e.target.closest("[data-tpl]"); if (!b || b.classList.contains("have")) return;
          const t = TPL[b.dataset.tpl];
          S().habits.push(Object.assign({}, t, { id: "h" + Date.now(), created: Date.now(), steps: (t.steps || [1]).slice() }));
          Store.save(); haptic([10, 20, 10]); Sound.success();
          b.classList.add("have"); b.querySelector(".tpl-s").textContent = "✓ Toegevoegd";
          gsap.fromTo(b, { scale: 0.92 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
          toast(active().length > 3 ? `${t.e} ${t.t} toegevoegd · dat zijn er ${active().length}, begin klein` : `${t.e} ${t.t} toegevoegd · tik erop voor je plan`);
          if (window.App) App.refresh(false);
        });
      }
    });
  }

  /* ---------- manage sheet ---------- */
  function manageSheet() {
    const draw = () => S().habits.map(h => {
      const hist = history(h);
      return `<button class="card tap h-manage" data-open="${h.id}" style="width:100%;text-align:left">
        <div class="row" style="gap:12px">${ring(h)}<div style="flex:1;min-width:0"><div style="font-weight:600">${esc(h.t)}</div><div class="small muted">${TYPES[h.type].label}${h.type === "check" ? "" : " · " + (h.type === "limit" ? "max " : "") + fmt(h, h.target)} · 🔗 ${lineTxt(h)}</div></div></div>
        <div class="week-dots">${hist.map(d => `<i class="${d.today ? "today" : ""}" style="--p:${d.p};background:${d.over ? "var(--danger)" : d.done ? "var(--ok)" : `rgba(124,92,255,${0.12 + d.p * 0.6})`}"><b>${d.l}</b></i>`).join("")}</div>
      </button>`;
    }).join("") || `<div class="empty">Nog geen gewoontes.</div>`;
    sheet(`
      <h2>Gewoontes</h2>
      <p class="sub">Vervang het oude patroon met nieuwe gewoontes. Tik op een gewoonte voor details.</p>
      ${active().length > 3 ? tooManyHtml() : ""}
      <div data-list>${draw()}</div>
      <div style="margin-top:16px"><button class="btn" data-add>＋ Gewoonte toevoegen</button></div>`, {
      onMount(sh, close) {
        $("[data-list]", sh).addEventListener("click", e => {
          const b = e.target.closest("[data-open]"); if (!b) return;
          haptic(); Sound.tap(); close(); setTimeout(() => openHabit(b.dataset.open), 320);
        });
        $("[data-add]", sh).addEventListener("click", () => { haptic(); close(); setTimeout(addSheet, 320); });
      }
    });
  }

  /* ---------- weekly overview for the progress tab ---------- */
  function weekHtml() {
    const hs = S().habits;
    if (!hs.length) return `<div class="empty">Nog geen gewoontes.</div>`;
    return hs.map(h => {
      const hist = history(h), hit = hist.filter(d => d.done).length;
      const tot = hist.reduce((a, d) => a + (d.v || 0), 0);
      const info = h.type === "count" ? `${fmt(h, tot)} totaal` : h.type === "timer" ? `${Math.round(tot)} min totaal` : h.type === "limit" ? `gem. ${fmt(h, Math.round(tot / 7 * 10) / 10)}/dag` : "";
      return `<div class="h-week" data-open-habit="${h.id}">
        <span class="h-week-e">${esc(h.e)}</span>
        <span class="h-week-b"><div class="row between"><b>${esc(h.t)}</b><span class="small muted">${hit}/7${info ? " · " + info : ""}</span></div>
          <div class="h-spark">${hist.map(d => `<i style="height:${Math.max(8, d.p * 100)}%;background:${d.over ? "var(--danger)" : d.done ? "var(--ok)" : "rgba(124,92,255,.55)"}"></i>`).join("")}</div></span>
      </div>`;
    }).join("");
  }

  /* Called by tools when a session finishes (e.g. meditation minutes count for the meditation habit) */
  function onSession(kind, seconds) {
    if (kind !== "meditate") return;
    const h = S().habits.find(x => x.tpl === "meditate" && x.type === "timer");
    if (h) setVal(h, today(), val(h) + seconds / 60, { quiet: true });
    const list = S().reset[today()] || (S().reset[today()] = []);
    if (seconds >= 300 && !list.includes("meditate")) { list.push("meditate"); Store.save(); }
  }

  migrate();
  rollover();

  /* Midnight: minutes before 00:00 belong to the old day, the timer continues on the new day.
     If the app was closed for longer than a day, the timer is stopped at midnight. */
  function rollover() {
    const t = today();
    let changed = false;
    S().habits.forEach(h => {
      const r = running(h);
      if (!r || r.day === t) return;
      const d = new Date(r.start); d.setHours(24, 0, 0, 0);
      const midnight = d.getTime();
      const map = S().habitVal[r.day] || (S().habitVal[r.day] = {});
      map[h.id] = Math.round(((map[h.id] || 0) + Math.max(0, midnight - r.start) / 60000) * 100) / 100;
      mirror(h, r.day);
      if (Store.dayKey(midnight) === t) S().habitTimer[h.id] = { start: midnight, day: t };
      else delete S().habitTimer[h.id];
      changed = true;
    });
    if (changed) Store.save();
    return changed;
  }

  /* Add to the value of a habit made from a template (e.g. lesson minutes → "Iets nieuws leren") */
  function addToTpl(tpl, amount) {
    const h = S().habits.find(x => x.tpl === tpl);
    if (h && h.type !== "check") setVal(h, today(), val(h) + amount, { quiet: true });
  }

  window.Habits = { rollover, addToTpl, val, progress, over, fmt, listHtml, handleClick, openHabit, manageSheet, addSheet, editHabit, weekHtml, doneCount, isDone, streak, onSession, TEMPLATES, get,
    status, setStatus, shown, weekly, weekDone, atRisk, plan, planText, ANCHORS, SKIP_REASONS,
    active, autoDue, autoSheet, autoCardHtml, reminderLevel, nudges, monday };
})();
