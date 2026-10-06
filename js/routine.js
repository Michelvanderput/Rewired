/* Morning and evening routine: a guided, step-by-step flow to start and end the day the same way.
   - Config: state.routines.{morning,evening}.steps = [{ id, e, t, s, min, core, kind, habit, reset, on }]
     kind: "do" (tap done), "intention" (write a line), "mood" (end-of-day check-in); min > 0 shows a timer.
     core = part of the short version; habit = [template, amount] and reset = Dopamine Reset id that count along.
   - Log: state.routineLog[day].{morning,evening} = { done: [ids], skipped: [ids], start, end, short, text }
     The evening's "plan voor morgen" (text) is shown again in the next morning's intention step.
   - Start times live in the push reminders (rmorning / revening) so there is one source of truth. */
(function () {
  const { $, $$, esc, haptic, toast, sheet, fullscreen, wake } = FX;
  const DAY = Store.DAY;
  const S = () => Store.s;

  const PRESETS = {
    morning: [
      { id: "m_up", e: "⏰", t: "Direct opstaan", s: "Wekker aan de andere kant van de kamer. Niet snoozen.", core: true, habit: ["nosnooze"] },
      { id: "m_water", e: "💧", t: "Glas water", s: "Je lichaam heeft 8 uur niets gehad.", core: true, habit: ["water", 250] },
      { id: "m_bed", e: "🛏️", t: "Bed opmaken", s: "De eerste kleine overwinning van de dag.", habit: ["makebed"] },
      { id: "m_light", e: "☀️", t: "Daglicht", s: "Even naar buiten of bij het raam. Zet je biologische klok goed.", min: 5, reset: "sun", habit: ["outside", 5] },
      { id: "m_move", e: "🤸", t: "Bewegen", s: "10 push-ups, squats of even stretchen.", min: 3, habit: ["pushups", 10] },
      { id: "m_cold", e: "🧊", t: "Koud afsluiten", s: "De laatste 30 seconden van je douche koud.", core: true, reset: "cold", habit: ["cold"] },
      { id: "m_breath", e: "🧘", t: "Ademen of mediteren", s: "Rustig in door je neus, langzaam uit.", min: 2, habit: ["meditate", 2] },
      { id: "m_intent", e: "🎯", t: "Focus voor vandaag", s: "Wat maakt vandaag een goede dag?", kind: "intention", core: true },
      { id: "m_nophone", e: "📵", t: "Eerste uur geen social media", s: "Eerst jouw dag, dan die van anderen.", core: true, reset: "nophone" }
    ],
    evening: [
      { id: "e_tidy", e: "🧹", t: "Klaarzetten voor morgen", s: "Kleren, tas, ontbijt. Morgen-jij is je dankbaar.", min: 5 },
      { id: "e_mood", e: "🌗", t: "Hoe was je dag?", s: "Eén tik. Zo zie je later je patronen.", kind: "mood", core: true },
      { id: "e_grat", e: "🙏", t: "3 dingen waar je dankbaar voor bent", s: "Groot of klein, het telt allemaal.", habit: ["gratitude", 3] },
      { id: "e_plan", e: "🗓️", t: "Plan voor morgen", s: "Wat zijn je 3 belangrijkste dingen? Je ziet ze morgenochtend terug.", kind: "intention", core: true, reset: "journal" },
      { id: "e_phone", e: "🔌", t: "Telefoon buiten de slaapkamer", s: "Aan de lader in de gang. Je belangrijkste stap van de avond.", core: true, reset: "sleep", habit: ["bedroom"] },
      { id: "e_read", e: "📖", t: "Lezen", s: "Papier, geen scherm.", min: 10, habit: ["read", 10] },
      { id: "e_breath", e: "🌬️", t: "Ademhaling 4-7-8", s: "4 tellen in, 7 vast, 8 uit. Je zenuwstelsel komt tot rust.", min: 2 },
      { id: "e_lights", e: "🌙", t: "Lichten uit", s: "Elke avond rond dezelfde tijd houdt je ritme stabiel.", core: true }
    ]
  };
  const META = {
    morning: { e: "🌅", t: "Ochtendroutine", done: "Je dag is gestart", bg: "radial-gradient(circle at 50% 18%, #6b3a1f 0%, #2a1640 45%, #07070d 85%)", reminder: "rmorning", def: "07:00" },
    evening: { e: "🌙", t: "Avondroutine", done: "Dag afgesloten", bg: "radial-gradient(circle at 50% 15%, #1d2a5e 0%, #110d2b 50%, #05050a 85%)", reminder: "revening", def: "22:00" }
  };
  const MOODS = ["😫", "😕", "😐", "🙂", "😄"];

  /* ---------- config & log ---------- */
  function cfg(which) {
    const all = S().routines || (S().routines = {});
    if (!all[which]) all[which] = { steps: PRESETS[which].map(p => Object.assign({ on: true }, p)) };
    return all[which];
  }
  const steps = (which, short) => cfg(which).steps.filter(st => st.on && (!short || st.core));
  /* short version by default for ADHD, or after choosing "Korte routines" in the starter plan */
  const defShort = () => !!(S().routineShort || (window.Focus && Focus.has("adhd")));
  const shortOf = L => (L && L.short != null ? !!L.short : defShort());
  const mins = list => Math.max(1, Math.round(list.reduce((a, st) => a + (st.min || 1), 0)));
  /* the evening belongs to the day it started: 00:30 is still "last night" */
  const dayOf = (which, d = new Date()) => which === "evening" && d.getHours() < 4 ? Store.dayKey(d.getTime() - DAY) : Store.dayKey(d);
  function log(which, day = dayOf(which)) {
    const all = S().routineLog || (S().routineLog = {});
    const d = all[day] || (all[day] = {});
    return d[which] || (d[which] = { done: [], skipped: [] });
  }
  const peek = (which, day = dayOf(which)) => ((S().routineLog || {})[day] || {})[which] || null;
  const finished = (which, day) => !!(peek(which, day) || {}).end;
  const time = which => (window.Push ? Push.prefs().reminders[META[which].reminder] : null)?.time || META[which].def;
  const toMin = t => +t.slice(0, 2) * 60 + +t.slice(3);

  /* Which routine fits now: morning 04:00–12:00, evening from 90 minutes before its time (at least 19:00) until 04:00 */
  function current(d = new Date()) {
    const m = d.getHours() * 60 + d.getMinutes();
    if (m >= 240 && m < 720) return "morning";
    const from = Math.max(19 * 60, toMin(time("evening")) - 90);
    if (m >= from || m < 240) return "evening";
    return null;
  }

  /* Count a done step along with the habit and the Dopamine Reset it stands for */
  function apply(st) {
    if (st.habit && window.Habits) Habits.markTpl(st.habit[0], st.habit[1] || 0);
    if (st.reset) {
      const list = S().reset[Store.dayKey()] || (S().reset[Store.dayKey()] = []);
      if (!list.includes(st.reset)) list.push(st.reset);
    }
  }

  /* ---------- the guided flow ---------- */
  function start(which = current() || "morning") {
    if ($("#fs-root").children.length) return;
    const M = META[which], L = log(which);
    // timer: counts towards an end time, so it stays right when the phone locks and intervals pause
    let short = shortOf(L), list = steps(which, short), i = -1, timer = null, left = 0, endAt = 0, running = false;
    const prevPlan = which === "morning" ? ((peek("evening", Store.dayKey(Date.now() - DAY)) || {}).text || "") : "";
    const calm = FX.calm();

    const dots = () => `<div class="rt-dots">${list.map((st, k) => `<i class="${L.done.includes(st.id) ? "done" : L.skipped.includes(st.id) ? "skip" : ""} ${k === i ? "cur" : ""}"></i>`).join("")}</div>`;
    const clock = s => Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

    function intro() {
      const doneN = list.filter(st => L.done.includes(st.id)).length;
      const name = S().name ? ", " + esc(S().name) : "";
      return `<div class="rt-step" data-pane>
        <div class="rt-emo" data-pop>${M.e}</div>
        <div class="eyebrow">${M.t}</div>
        <h2 class="rt-title">${which === "morning" ? `Goedemorgen${name}` : `Tijd om af te sluiten${name}`}</h2>
        <p class="rt-sub">${which === "morning" ? "Begin je dag bewust, voordat de rest van de wereld zich meldt." : "Rond de dag af zodat je hoofd en je telefoon tot rust komen."}</p>
        ${prevPlan ? `<div class="rt-note"><div class="eyebrow">Je plan van gisteravond</div><div>${esc(prevPlan)}</div></div>` : ""}
        <div class="rt-list">${steps(which).map(st => `<div class="${short && !st.core ? "off" : ""}"><span>${st.e}</span>${esc(st.t)}${st.min ? ` <small>${st.min} min</small>` : ""}${L.done.includes(st.id) ? " <b>✓</b>" : ""}</div>`).join("")}</div>
      </div>
      <div class="fs-bottom rt-actions">
        <button class="btn" data-go>${doneN ? "Verder" : "Start"} · ±${mins(list)} min</button>
        <div class="seg" data-short style="margin-top:10px"><button class="${short ? "" : "on"}" data-v="0">Volledig (${steps(which).length})</button><button class="${short ? "on" : ""}" data-v="1">Kort (${steps(which, true).length})</button></div>
      </div>`;
    }

    function stepHtml(st) {
      const tm = st.min ? `<div class="rt-timer" data-timer><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="bg"/><circle cx="60" cy="60" r="54" class="fg" data-arc/></svg><span data-left>${clock(st.min * 60)}</span></div>
        <button class="btn ghost sm" data-tgo style="margin:0 auto">▶ Start timer</button>` : "";
      let extra = "";
      if (st.kind === "intention") {
        const val = L.text || "";
        extra = `${which === "morning" && prevPlan ? `<div class="rt-note"><div class="eyebrow">Gisteravond nam je je voor</div><div>${esc(prevPlan)}</div></div>` : ""}
          <textarea class="field rt-text" data-text maxlength="300" placeholder="${which === "evening" ? "1. …  2. …  3. …" : "Vandaag ga ik voor …"}">${esc(val)}</textarea>`;
      }
      if (st.kind === "mood") {
        const ci = S().checkins[Store.dayKey()];
        extra = ci ? `<div class="rt-note">Check-in van vandaag: ${esc(ci.mood || "")} gedaan ✓</div>`
          : `<div class="mood-row rt-moods" data-moods>${MOODS.map(m => `<button data-v="${m}">${m}</button>`).join("")}</div>`;
      }
      return `<div class="rt-step" data-pane>
        <div class="rt-count">Stap ${i + 1} van ${list.length}</div>
        <div class="rt-emo" data-pop>${st.e}</div>
        <h2 class="rt-title">${esc(st.t)}</h2>
        ${st.s ? `<p class="rt-sub">${esc(st.s)}</p>` : ""}
        ${tm}${extra}
      </div>
      <div class="fs-bottom rt-actions">
        <button class="btn" data-done ${st.kind === "mood" && !S().checkins[Store.dayKey()] ? "disabled" : ""}>Klaar ✓</button>
        <button class="btn ghost" data-skip style="margin-top:10px">Sla over</button>
      </div>`;
    }

    function endHtml() {
      const done = list.filter(st => L.done.includes(st.id)).length;
      const dur = L.start ? Math.max(1, Math.round((L.end - L.start) / 60000)) : 0;
      return `<div class="rt-step" data-pane>
        <div class="rt-emo" data-pop>${which === "morning" ? "🌤️" : "😴"}</div>
        <div class="eyebrow">${M.t} · ${done}/${list.length} stappen${dur ? " · " + dur + " min" : ""}</div>
        <h2 class="rt-title">${M.done}</h2>
        <p class="rt-sub">${which === "morning" ? "Wat je nu gedaan hebt, kan de dag je niet meer afpakken." : "Je telefoon kan nu weg. Welterusten."}</p>
        ${L.text ? `<div class="rt-note"><div class="eyebrow">${which === "morning" ? "Je focus vandaag" : "Je plan voor morgen"}</div><div>${esc(L.text)}</div></div>` : ""}
      </div>
      <div class="fs-bottom rt-actions"><button class="btn" data-close>Sluiten</button></div>`;
    }

    let root;
    function render(html) {
      clearInterval(timer); running = false;
      const body = $("[data-body]", root);
      const swap = () => {
        body.innerHTML = html;
        $("[data-dots]", root).innerHTML = i >= 0 && i < list.length ? dots() : "";
        if (calm) gsap.fromTo(body, { opacity: 0 }, { opacity: 1, duration: 0.25 });
        else {
          gsap.fromTo(body, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" });
          gsap.from($("[data-pop]", body), { scale: 0.5, duration: 0.6, ease: "back.out(2.2)" });
        }
      };
      if (body.innerHTML && !calm) gsap.to(body, { opacity: 0, x: -24, duration: 0.2, ease: "power2.in", onComplete: swap });
      else swap();
    }

    function go(n) {
      i = n; left = 0;
      while (i < list.length && L.done.includes(list[i].id)) i++;
      if (i >= list.length) {
        L.end = Date.now(); Store.save();
        Sound.success(); haptic([10, 30, 10]);
        render(endHtml());
        if (window.App) setTimeout(() => App.refresh(false), 400);
        return;
      }
      render(stepHtml(list[i]));
    }

    function tick() {
      left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      const st = list[i], el = $("[data-left]", root), arc = $("[data-arc]", root);
      if (el) el.textContent = clock(Math.max(0, left));
      if (arc) arc.style.strokeDashoffset = String(339.3 * (1 - Math.max(0, left) / (st.min * 60)));
      if (left <= 0) { clearInterval(timer); running = false; Sound.bell(); haptic([20, 40, 20]); const b = $("[data-tgo]", root); if (b) b.textContent = "Tijd is om ✓"; }
    }

    const close = fullscreen(`
      <div class="fs-top rt-top"><button class="icon-btn" data-close aria-label="Sluiten">${FX.closeIcon}</button><div data-dots></div><span style="width:44px"></span></div>
      <div class="rt-body" data-body></div>`, {
      bg: M.bg,
      onClose() { clearInterval(timer); wake(false); if (window.App) App.refresh(false); },
      onMount(el, closeFn) {
        root = el; wake(true);
        render(intro());
        el.addEventListener("click", e => {
          const t = e.target;
          if (t.closest("[data-close]") && !t.closest(".rt-top")) { closeFn(); return; }
          const sh = t.closest("[data-short] [data-v]");
          if (sh) { short = sh.dataset.v === "1"; L.short = short; list = steps(which, short); haptic(); Sound.tap(); render(intro()); return; }
          if (t.closest("[data-go]")) { if (!L.start) L.start = Date.now(); Store.save(); haptic(); Sound.tap(); go(0); return; }
          if (t.closest("[data-tgo]")) {
            const st = list[i];
            if (left <= 0) left = st.min * 60;
            if (running) { clearInterval(timer); running = false; t.closest("[data-tgo]").textContent = "▶ Verder"; }
            else { running = true; endAt = Date.now() + left * 1000; timer = setInterval(tick, 250); t.closest("[data-tgo]").textContent = "⏸ Pauze"; }
            haptic(); Sound.tap(); return;
          }
          const mb = t.closest("[data-moods] [data-v]");
          if (mb) {
            Store.checkin({ mood: mb.dataset.v, note: "" });
            $$("[data-moods] button", root).forEach(x => x.classList.toggle("on", x === mb));
            $("[data-done]", root).disabled = false; haptic(); Sound.tap(); return;
          }
          if (t.closest("[data-done]") && !t.closest("[data-done]").disabled) {
            const st = list[i];
            const tx = $("[data-text]", root);
            if (tx) L.text = tx.value.trim();
            if (!L.done.includes(st.id)) L.done.push(st.id);
            L.skipped = L.skipped.filter(x => x !== st.id);
            apply(st); Store.save(); haptic([10, 20, 10]); Sound.toggle(true);
            go(i + 1); return;
          }
          if (t.closest("[data-skip]")) {
            const st = list[i], tx = $("[data-text]", root);
            if (tx && tx.value.trim()) L.text = tx.value.trim();
            if (!L.skipped.includes(st.id)) L.skipped.push(st.id);
            Store.save(); haptic(); Sound.tap();
            go(i + 1);
          }
        });
      }
    });
    return close;
  }

  /* ---------- home card ---------- */
  function homeCardHtml() {
    const which = current();
    if (!which || finished(which)) return "";
    const M = META[which], L = peek(which) || { done: [] }, list = steps(which, shortOf(L));
    const n = list.filter(st => L.done.includes(st.id)).length;
    return `<button class="card tap rt-card ${which}" data-routine="${which}" data-anim>
      <span class="rt-card-e">${M.e}</span>
      <span style="flex:1;min-width:0"><div style="font-weight:600">${M.t}</div>
        <div class="small muted">${n ? `${n}/${list.length} stappen · verder waar je was` : `${list.length} stappen · ±${mins(list)} min`}</div>
        <div class="bar" style="margin-top:8px"><i style="width:${(n / Math.max(1, list.length)) * 100}%"></i></div></span>
      <span class="btn sm">${n ? "Verder" : "Start"}</span></button>`;
  }

  /* Last 7 days for a routine: ● finished, ◐ started, · nothing */
  function weekHtml(which) {
    let out = "";
    for (let k = 6; k >= 0; k--) {
      const d = new Date(Date.now() - k * DAY), L = peek(which, Store.dayKey(d));
      const cls = L && L.end ? "done" : L && L.done.length ? "half" : "";
      out += `<i class="${cls}"><b>${["Z", "M", "D", "W", "D", "V", "Z"][d.getDay()]}</b></i>`;
    }
    return `<div class="week-dots">${out}</div>`;
  }

  /* ---------- overview + editor ---------- */
  function overview() {
    const card = which => {
      const M = META[which], list = steps(which);
      return `<div class="card" style="margin-top:12px">
        <div class="row between"><div style="font-weight:600;font-size:17px">${M.e} ${M.t}</div><span class="small muted">om ${time(which)}</span></div>
        <div class="small muted" style="margin-top:4px">${list.length} stappen · ±${mins(list)} min · kort: ${steps(which, true).length} stappen</div>
        ${weekHtml(which)}
        <div class="row" style="gap:8px;margin-top:14px"><button class="btn sm" data-start="${which}" style="flex:1">${finished(which) ? "Nog een keer" : "Start"}</button><button class="btn sm ghost" data-edit="${which}" style="flex:1">Aanpassen</button></div></div>`;
    };
    sheet(`
      <h2>Ochtend & avond</h2>
      <p class="sub">Elke dag op dezelfde manier beginnen en eindigen. Vaste volgorde, weinig nadenken: zo wordt het een routine.</p>
      ${card("morning")}${card("evening")}`, {
      onMount(sh, closeSheet) {
        sh.addEventListener("click", e => {
          const s = e.target.closest("[data-start]"), ed = e.target.closest("[data-edit]");
          if (s) {
            haptic(); closeSheet();
            const w = s.dataset.start;
            // "Nog een keer": start fresh, keep the written text
            if (finished(w)) { const L = log(w); L.done = []; L.skipped = []; delete L.end; delete L.start; Store.save(); }
            setTimeout(() => start(w), 320);
          }
          if (ed) { haptic(); closeSheet(); setTimeout(() => edit(ed.dataset.edit), 320); }
        });
      }
    });
  }

  function edit(which) {
    const M = META[which], c = cfg(which);
    const row = (st, k) => `<div class="list-item rt-edit ${st.on ? "" : "off"}" data-k="${k}">
      <span style="font-size:22px">${esc(st.e)}</span>
      <span class="li-body"><div class="li-title" style="font-size:15px">${esc(st.t)}</div><div class="li-sub">${st.min ? st.min + " min · " : ""}<button class="link small" data-core>${st.core ? "★ in korte versie" : "☆ niet in korte versie"}</button></div></span>
      <span class="rt-move"><button data-up aria-label="Omhoog" ${k === 0 ? "disabled" : ""}>↑</button><button data-down aria-label="Omlaag" ${k === c.steps.length - 1 ? "disabled" : ""}>↓</button></span>
      <button class="switch ${st.on ? "on" : ""}" data-on role="switch" aria-checked="${st.on}"><i></i></button></div>`;
    const draw = () => c.steps.map(row).join("");
    sheet(`
      <h2>${M.e} ${M.t} aanpassen</h2>
      <p class="sub">Zet stappen aan of uit, verander de volgorde en kies wat in de korte versie zit (★).</p>
      <div class="row between" style="margin-top:6px"><span>Begintijd · herinnering</span><input type="time" class="field time-in" style="width:110px" data-time value="${esc(time(which))}"></div>
      <div class="card flush" style="margin-top:14px" data-steps>${draw()}</div>
      <label class="lbl">Eigen stap toevoegen</label>
      <div class="row"><input class="field" data-ne maxlength="4" style="width:62px;text-align:center" value="⭐"><input class="field" data-nt maxlength="50" placeholder="bijv. Vitamines nemen"></div>
      <div class="row" style="margin-top:10px"><input class="field" data-nm type="number" inputmode="numeric" min="0" max="60" placeholder="Minuten (optioneel)"><button class="btn sm" data-add>Toevoegen</button></div>
      <div style="margin-top:22px"><button class="btn ghost" data-reset>Standaardstappen herstellen</button></div>`, {
      onClose() { if (window.App) App.refresh(false); },
      onMount(sh) {
        const box = $("[data-steps]", sh), redraw = () => { box.innerHTML = draw(); };
        box.addEventListener("click", e => {
          const r = e.target.closest("[data-k]"); if (!r) return;
          const k = +r.dataset.k, st = c.steps[k];
          if (e.target.closest("[data-on]")) st.on = !st.on;
          else if (e.target.closest("[data-core]")) st.core = !st.core;
          else if (e.target.closest("[data-up]") && k > 0) c.steps.splice(k - 1, 0, c.steps.splice(k, 1)[0]);
          else if (e.target.closest("[data-down]") && k < c.steps.length - 1) c.steps.splice(k + 1, 0, c.steps.splice(k, 1)[0]);
          else return;
          haptic(); Sound.tap(); Store.save(); redraw();
        });
        $("[data-time]", sh).addEventListener("change", e => {
          if (!/^\d{2}:\d{2}$/.test(e.target.value) || !window.Push) return;
          Push.prefs().reminders[M.reminder].time = e.target.value; Store.save(); toast("Tijd opgeslagen");
        });
        $("[data-add]", sh).addEventListener("click", () => {
          const t = $("[data-nt]", sh).value.trim();
          if (!t) { gsap.fromTo($("[data-nt]", sh), { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" }); return; }
          const m = Math.max(0, Math.min(60, parseInt($("[data-nm]", sh).value, 10) || 0));
          c.steps.push({ id: "c" + Date.now(), e: $("[data-ne]", sh).value.trim() || "⭐", t, s: "", min: m, on: true, core: false, custom: true });
          Store.save(); haptic([10, 20, 10]); Sound.success(); redraw();
          $("[data-nt]", sh).value = ""; $("[data-nm]", sh).value = "";
          toast("Stap toegevoegd");
        });
        const rs = $("[data-reset]", sh);
        rs.addEventListener("click", () => {
          if (rs.dataset.sure !== "1") { rs.dataset.sure = "1"; rs.textContent = "Zeker weten? Eigen stappen verdwijnen"; return; }
          delete S().routines[which]; Object.assign(c, cfg(which)); Store.save(); redraw();
          rs.dataset.sure = ""; rs.textContent = "Standaardstappen herstellen"; toast("Standaard hersteld");
        });
      }
    });
  }

  /* ---------- recap + push ---------- */
  /* Only once someone has used routines, so the recap doesn't nag about something they never chose */
  function recapItems(day) {
    const out = { good: [], bad: [] };
    if (!Object.keys(S().routineLog || {}).length) return out;
    ["morning", "evening"].forEach(which => {
      const L = peek(which, day), M = META[which], list = steps(which, L && L.short);
      const n = L ? list.filter(st => L.done.includes(st.id)).length : 0;
      if (L && L.end) out.good.push({ e: M.e, t: `${M.t}: ${n}/${list.length} stappen${L.short ? " (kort)" : ""}`, short: M.t });
      else if (L && n) out.bad.push({ e: M.e, t: `${M.t}: ${n}/${list.length}, niet afgerond`, short: M.t });
      else out.bad.push({ e: M.e, t: `${M.t} niet gedaan`, short: M.t });
    });
    return out;
  }
  /* Days on which the reminder is no longer needed because the routine is done (sent to the push server) */
  function doneDays() {
    const out = {};
    if (finished("morning", Store.dayKey())) out.rmorning = Store.dayKey();
    const ev = dayOf("evening");
    if (finished("evening", ev)) out.revening = ev;
    return out;
  }

  window.Routine = { start, current, homeCardHtml, overview, edit, recapItems, doneDays, steps, finished, PRESETS };
})();
