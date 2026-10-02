/* Weekly reflection: on Sunday (and Monday/Tuesday if missed) three short questions about the week that ends.
   Stored in state.reflections[mondayKey] = { ts, good, hard, change }.
   Next week's reflection opens with what you planned to change last time, so the loop closes. */
(function () {
  const { $, esc, haptic, toast, sheet } = FX;
  const DAY = Store.DAY;
  const S = () => Store.s;
  const all = () => S().reflections || (S().reflections = {});

  const QUESTIONS = [
    ["good", "Wat ging goed deze week?", "bijv. 4× gesport, avonden zonder telefoon in bed"],
    ["hard", "Wat maakte het lastig?", "bijv. laat thuis van werk, alleen op de bank"],
    ["change", "Wat pas je volgende week aan?", "bijv. telefoon om 22:30 aan de lader in de gang"]
  ];

  /* The week to reflect on: on Sunday the current week, on Monday/Tuesday the one that just ended */
  function weekToReflect(d = new Date()) {
    const dow = d.getDay();
    if (dow === 0 && d.getHours() >= 12) return Habits.monday(d.getTime());
    if (dow === 1 || dow === 2) return Habits.monday(d.getTime() - 7 * DAY);
    return null;
  }
  const keyOf = m => Store.dayKey(m);
  const done = m => !!all()[keyOf(m)];
  function due() {
    const m = weekToReflect();
    return m && done(m) === false && S().reflectSkip !== keyOf(m) ? m : null;
  }
  const doneThisWeek = () => done(Habits.monday());

  const range = m => {
    const f = d => new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    return `${f(m)} – ${f(m + 6 * DAY)}`;
  };

  /* Facts about the week, shown above the questions (informational, no score) */
  function stats(m) {
    const s = S(), start = m - 12 * 3600000, end = start + 7 * DAY;
    const urges = s.urges.filter(u => u.ts >= start && u.ts < end);
    const rel = s.relapses.filter(r => r.ts >= start && r.ts < end).length;
    let checkins = 0;
    for (let i = 0; i < 7; i++) if (s.checkins[Store.dayKey(m + i * DAY)]) checkins++;
    const habits = Habits.active().filter(h => (h.created || 0) < end).map(h => ({ h, n: Habits.weekDone(h, m + 6 * DAY), of: Habits.weekly(h) }));
    return { urges: urges.length, resisted: urges.filter(u => u.resisted).length, rel, checkins, habits };
  }

  function statsHtml(m) {
    const st = stats(m);
    return `<div class="card" style="margin-top:4px">
      ${st.habits.map(x => `<div class="row between" style="padding:4px 0"><span>${esc(x.h.e)} ${esc(x.h.t)}</span><span class="${x.n >= x.of ? "" : "muted"}">${x.n}/${x.of}${x.n >= x.of ? " ✓" : ""}</span></div>`).join("")}
      <div class="small muted" style="margin-top:${st.habits.length ? 10 : 0}px">🌊 ${st.urges} drang gelogd · ${st.resisted} weerstaan${st.rel ? ` · ${st.rel} terugval` : ""} · ✍️ ${st.checkins}/7 check‑ins</div>
    </div>`;
  }

  function open(m = due() || weekToReflect() || Habits.monday()) {
    const prev = all()[keyOf(m - 7 * DAY)], cur = all()[keyOf(m)] || {};
    sheet(`
      <div class="eyebrow">Weekreflectie · ${range(m)}</div>
      <h2>Hoe ging je week?</h2>
      <p class="sub">Drie vragen, twee minuten. Terugkijken helpt je plan bij te sturen.</p>
      ${prev && prev.change ? `<div class="card" style="border-color:rgba(124,92,255,.45);margin-bottom:12px"><div class="eyebrow">Vorige week nam je je voor</div><div style="margin-top:6px">${esc(prev.change)}</div></div>` : ""}
      ${statsHtml(m)}
      ${QUESTIONS.map(([k, q, ph]) => `<label class="lbl" style="text-transform:none;letter-spacing:0;font-size:15px;color:#fff">${q}</label><textarea class="field" data-r="${k}" maxlength="500" placeholder="${ph}">${esc(cur[k] || "")}</textarea>`).join("")}
      <div style="margin-top:22px"><button class="btn" data-save>Opslaan</button></div>
      <div style="margin-top:10px"><button class="btn ghost" data-plan>Gewoontes aanpassen</button></div>
      ${due() ? `<div style="margin-top:10px;text-align:center"><button class="small muted" data-skip>Deze week overslaan</button></div>` : ""}`, {
      onClose() { if (window.App) App.refresh(false); },
      onMount(sh, close) {
        $("[data-save]", sh).addEventListener("click", () => {
          const r = { ts: Date.now() };
          QUESTIONS.forEach(([k]) => { r[k] = $(`[data-r="${k}"]`, sh).value.trim(); });
          if (!r.good && !r.hard && !r.change) { gsap.fromTo($("[data-r]", sh), { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" }); return; }
          all()[keyOf(m)] = r; Store.save();
          haptic([10, 20, 10]); Sound.success(); close();
          toast(r.change ? "Opgeslagen · volgende week zie je je voornemen terug" : "Weekreflectie opgeslagen");
        });
        $("[data-plan]", sh).addEventListener("click", () => { close(); setTimeout(() => Habits.manageSheet(), 320); });
        const sk = $("[data-skip]", sh);
        if (sk) sk.addEventListener("click", () => { S().reflectSkip = keyOf(m); Store.save(); close(); });
      }
    });
  }

  function homeCardHtml() {
    const m = due();
    if (!m) return "";
    return `<button class="card tap" data-action="reflect" data-anim style="width:100%;text-align:left;display:flex;gap:12px;align-items:center;margin-bottom:12px;border-color:rgba(124,92,255,.45)">
      <span style="font-size:24px">🪞</span><span style="flex:1;min-width:0"><div style="font-weight:600">Weekreflectie</div><div class="small muted">${range(m)} · 3 vragen</div></span><span class="muted">›</span></button>`;
  }

  function progressHtml() {
    const list = Object.entries(all()).sort((a, b) => (a[0] < b[0] ? 1 : -1)).slice(0, 4);
    if (!list.length) return `<div class="empty">Elke zondag kijk je in 3 vragen terug op je week.<br><button class="link" style="color:var(--accent2);margin-top:8px" data-action="reflect">Nu invullen</button></div>`;
    return list.map(([k, r]) => `<div class="refl">
      <div class="eyebrow">${range(Date.parse(k + "T12:00:00"))}</div>
      ${r.good ? `<div><b>Goed:</b> ${esc(r.good)}</div>` : ""}${r.hard ? `<div><b>Lastig:</b> ${esc(r.hard)}</div>` : ""}${r.change ? `<div><b>Aanpassen:</b> ${esc(r.change)}</div>` : ""}</div>`).join("");
  }

  window.Reflect = { open, due, doneThisWeek, homeCardHtml, progressHtml, weekToReflect };
})();
