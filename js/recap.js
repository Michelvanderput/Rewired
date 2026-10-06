/* Morning recap of the previous day: score, what went well, what could be better, tips and a focus for today.
   Computed on the phone. Only a one-line summary goes to the server for the morning notification. */
(function () {
  const { $, $$, esc, haptic, fullscreen, closeIcon, confetti } = FX;
  const DAY = Store.DAY;
  const S = () => Store.s;

  const TIPS = {
    water: "Zet 's avonds een gevulde fles naast je bed en drink 500 ml direct na het opstaan.",
    steps: "Loop tijdens elk telefoongesprek en maak na de lunch 10 minuten een blokje om.",
    veggies: "Maak groente de helft van je bord bij het avondeten en neem fruit mee voor onderweg.",
    sleep: "Zet een 'naar bed'-alarm een uur voor je bedtijd en dim dan alle schermen.",
    vitamins: "Leg je vitamines naast je koffiezetapparaat of tandenborstel.",
    floss: "Leg de floss bovenop je tandenborstel, dan kun je hem niet missen.",
    pushups: "Doe 10 push-ups elke keer dat je van de wc komt: zo haal je 50 zonder extra tijd.",
    squats: "Verdeel het in sets van 10, gekoppeld aan vaste momenten: opstaan, lunch, avond.",
    situps: "Verdeel het in sets van 10, gekoppeld aan vaste momenten: opstaan, lunch, avond.",
    pullups: "Hang een optrekstang in een deurpost waar je vaak langsloopt en doe elke keer 2.",
    plank: "Doe je plank direct na het opstaan, voordat je je telefoon pakt.",
    workout: "Plan je training als afspraak in je agenda en leg je sportkleding de avond ervoor klaar.",
    cold: "Begin klein: alleen de laatste 30 seconden koud telt ook.",
    meditate: "Koppel mediteren aan iets wat je al doet: 5 minuten direct na het tandenpoetsen.",
    read: "Leg je boek op je kussen en lees 10 minuten voordat je in bed je telefoon pakt.",
    deepwork: "Blok het eerste uur van je werkdag en leg je telefoon in een andere kamer.",
    outside: "Drink je ochtendkoffie buiten, of loop naar de winkel in plaats van te rijden.",
    learn: "Kies van tevoren wát je gaat leren, dan hoef je alleen nog te beginnen.",
    gratitude: "Schrijf voor het slapen 3 dingen op. Kleine dingen tellen ook.",
    screen: "Zet App-limieten aan in Schermtijd en zet je scherm na 21:00 op grijstinten.",
    social: "Zet social media-apps op de laatste pagina van je telefoon, of log uit na gebruik.",
    coffee: "Geen cafeïne na 14:00. Vervang je laatste kop door water of cafeïnevrij.",
    sugar: "Haal snoep uit huis en neem een gezonde snack mee voor je middagdip.",
    alcohol: "Beslis vooraf hoeveel je drinkt en neem na elk drankje een glas water.",
    wake: "Zet je wekker aan de andere kant van de kamer en open meteen de gordijnen.",
    bed: "Zet een alarm 30 minuten voor bedtijd: telefoon aan de lader, buiten de slaapkamer.",
    nosnooze: "Leg je wekker buiten handbereik. Sta op bij de eerste keer, denk pas daarna.",
    bedroom: "Koop een simpele wekker en laad je telefoon voortaan op in de keuken.",
    makebed: "Maak je bed direct als je eruit stapt: 60 seconden en je eerste overwinning."
  };
  const TYPE_TIPS = {
    count: "Verdeel je doel over drie vaste momenten (ochtend, middag, avond) in plaats van alles in één keer.",
    timer: "Plan een vast tijdslot en start de timer meteen, ook al is het maar 5 minuten.",
    check: "Koppel deze gewoonte aan iets wat je elke dag al doet (habit stacking).",
    limit: "Maak het moeilijker: uitloggen, apps verbergen of het gewoon niet in huis halen.",
    time: "Bereid 's avonds alles voor, zodat het moment zelf vanzelf gaat."
  };
  const TRIGGER_TIPS = {
    "Verveling": "Plan voor vrije momenten vooraf iets concreets: sporten, iemand bellen of een project.",
    "Stress": "Gebruik bij stress eerst 3× de fysiologische zucht of de noodknop, vóór je iets anders doet.",
    "Eenzaamheid": "Stuur vandaag iemand een bericht of spreek af. Verbinding is het beste tegengif.",
    "Social media": "Zet social media op een App-limiet en ontvolg accounts die je triggeren.",
    "Laat op bed": "Telefoon om 23:00 buiten de slaapkamer, en zet je risicomoment-melding 30 minuten eerder.",
    "Alleen thuis": "Gebruik je laptop alleen in de woonkamer en plan iets buiten de deur als je alleen bent.",
    "Moe": "Moe maakt kwetsbaar. Ga eerder slapen in plaats van 'nog even' op je telefoon.",
    "Verdriet": "Schrijf het van je af in je dagboek of ga bewegen. Voelen is oké, vluchten niet.",
    "Boosheid": "Beweeg de spanning eruit (push-ups, wandelen) voordat je naar je telefoon grijpt.",
    "Na alcohol": "Alcohol verlaagt je remmen. Zet een limiet-gewoonte voor alcohol aan."
  };

  const dateOf = key => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d); };
  const yesterday = () => Store.dayKey(Date.now() - DAY);
  const hm = ts => new Date(ts).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });

  function compute(day) {
    const s = S();
    const start = dateOf(day).getTime(), end = start + DAY;
    const firstDay = Store.dayKey(Math.min(s.firstStart || s.startDate, s.startDate));
    const empty = !s.onboarded || day < firstDay;
    const good = [], bad = [], tips = [];
    const H = window.Habits;

    // habits
    let habits = s.habits.filter(h => (h.created || 0) < end);
    let habitScore = 0, hDone = 0;
    const misses = [];
    // a planned rest day, or a skip that still fits the weekly target, is not a miss: leave it out of the count
    const excused = h => { const st = H.status(h, day); return !H.shown(h, day) && st && st.s === "skip" && (st.why === "Bewuste rustdag" || H.weekly(h) < 7); };
    habits.filter(excused).forEach(h => good.push({ e: h.e, t: `${h.t}: rustdag (${H.weekly(h) < 7 ? H.weekly(h) + "× per week" : "gepland"})`, short: h.t, neutral: true }));
    habits = habits.filter(h => !excused(h));
    habits.forEach(h => {
      const done = H.isDone(h, day), v = H.val(h, day), p = H.progress(h, day), f = x => H.fmt(h, x), st = H.status(h, day);
      if (!done && H.shown(h, day)) {
        hDone++; habitScore += 0.7;
        good.push({ e: h.e, t: `${h.t}: minimale versie${H.plan(h).min ? " (" + H.plan(h).min + ")" : ""}`, short: h.t });
      } else if (done) {
        hDone++; habitScore += 1;
        const txt = h.type === "check" ? h.t : h.type === "limit" ? `${h.t}: ${f(v)} (max ${f(h.target)})` : h.type === "time" ? `${h.t}: ${f(v)}` : `${h.t}: ${f(v)}`;
        good.push({ e: h.e, t: txt, short: h.t });
      } else {
        habitScore += h.type === "count" || h.type === "timer" ? p * 0.8 : 0;
        let txt;
        if (h.type === "count" || h.type === "timer") txt = `${h.t}: ${f(v)} van ${f(h.target)} (${Math.round(p * 100)}%)`;
        else if (h.type === "limit") txt = `${h.t}: ${f(v)}, dat is ${f(Math.round((v - h.target) * 100) / 100)} boven je limiet`;
        else if (h.type === "time") txt = v == null ? `${h.t}: niet gelogd` : `${h.t}: ${f(v)} (doel vóór ${f(h.target)})`;
        else txt = `${h.t}: niet gedaan`;
        if (st && st.s === "skip") txt = `${h.t}: overgeslagen${st.why ? " · " + st.why : ""}`;
        misses.push({ h, p: h.type === "limit" ? 0 : p });
        bad.push({ e: h.e, t: txt, short: h.t });
      }
    });
    misses.sort((a, b) => a.p - b.p);

    // dopamine reset
    const rDone = (s.reset[day] || []).length, rTot = DATA.resetTasks.length;
    if (rDone >= 6) good.push({ e: "⚡", t: `Dopamine Reset: ${rDone}/${rTot}`, short: "Dopamine Reset" });
    else if (rDone <= 3) bad.push({ e: "⚡", t: `Dopamine Reset: ${rDone}/${rTot}`, short: "Dopamine Reset" });

    // urges & relapses
    const urges = s.urges.filter(u => u.ts >= start && u.ts < end);
    const resisted = urges.filter(u => u.resisted).length, gaveIn = urges.length - resisted;
    const relapses = s.relapses.filter(r => r.ts >= start && r.ts < end);
    if (resisted) good.push({ e: "🛡️", t: `${resisted}× drang weerstaan`, short: `${resisted}× drang weerstaan` });
    if (relapses.length) {
      const r = relapses[relapses.length - 1];
      bad.unshift({ e: "↺", t: `Terugval om ${hm(r.ts)}${r.trigger ? " · " + r.trigger : ""}`, short: "terugval" });
      tips.push(TRIGGER_TIPS[r.trigger] || (window.Focus && Focus.TRIGGER_TIPS[r.trigger]) || "Log wat er vlak voor gebeurde, zo ontdek je je patroon.");
      const hr = new Date(r.ts).getHours();
      if (hr >= 21 || hr < 3) tips.push(`Je risicomoment ligt rond ${hm(r.ts)}. Zet je nachtmelding een half uur eerder en leg je telefoon dan weg.`);
    } else if (!empty && s.startDate < end) {
      const days = Math.floor((end - s.startDate) / DAY);
      good.unshift({ e: "✨", t: `Clean dag · streak ${days} ${days === 1 ? "dag" : "dagen"}`, short: "clean" });
    }
    if (gaveIn && !relapses.length) bad.push({ e: "🌊", t: `${gaveIn}× toegegeven aan een drang`, short: "drang" });

    // check-in & journal
    const ci = s.checkins[day];
    if (ci) good.push({ e: ci.mood || "🙂", t: `Check-in gedaan${ci.energy ? " · energie " + ci.energy + "/10" : ""}`, short: "check-in" });
    else if (!empty) bad.push({ e: "✍️", t: "Geen check-in", short: "check-in" });
    const notes = s.journal.filter(j => j.ts >= start && j.ts < end).length;
    if (notes) good.push({ e: "📝", t: `${notes} dagboek${notes === 1 ? "notitie" : "notities"}`, short: "dagboek" });

    // morning / evening routine
    if (window.Routine && !empty) { const r = Routine.recapItems(day); good.push(...r.good); bad.push(...r.bad); }

    // app usage from iOS Shortcuts
    if (window.AppTrack) { const a = AppTrack.recapItems(day); good.push(...a.good); bad.push(...a.bad); tips.push(...a.tips); }

    // recovery day
    const lastRel = s.relapses[s.relapses.length - 1];
    if (lastRel && Store.dayKey(lastRel.ts + DAY) === day && !relapses.length) {
      const done = (s.recoveryDone || {})[lastRel.ts];
      (done ? good : bad).push({ e: "🩹", t: done ? "Hersteldag voltooid" : "Hersteldag niet afgemaakt", short: "hersteldag" });
    }

    // tips: relapse first, then the weakest habits, then routines
    misses.slice(0, 3).forEach(m => tips.push(TIPS[m.h.tpl] || TYPE_TIPS[m.h.type]));
    if (rDone <= 3) tips.push("Begin met de twee makkelijkste Reset-taken: ochtendlicht en een telefoonvrij eerste uur.");
    if (!ci && !empty) tips.push("Een check-in kost 30 seconden. Zet de avondmelding aan via Profiel → Meldingen.");
    const uniqTips = [...new Set(tips)].slice(0, 3);

    // score (0-100)
    const parts = [];
    if (habits.length) parts.push([habitScore / habits.length, 45]);
    parts.push([Math.min(1, rDone / rTot), 25]);
    parts.push([relapses.length ? 0 : gaveIn ? 0.5 : 1, 20]);
    parts.push([ci ? 1 : 0, 10]);
    const wsum = parts.reduce((a, p) => a + p[1], 0);
    const score = Math.round(parts.reduce((a, p) => a + p[0] * p[1], 0) / wsum * 100);

    // focus for today
    let focus = "Herhaal gisteren. Consistentie wint van motivatie.";
    if (relapses.length) focus = "Vandaag is je hersteldag: werk de 6 stappen op home af. Telefoon om 23:00 uit de slaapkamer.";
    else if (misses.length) {
      const h = misses[0].h, f = x => H.fmt(h, x);
      focus = h.type === "count" ? `Vandaag: haal vóór 12:00 al de helft van ${h.t.toLowerCase()} (${f(h.target / 2)}).`
        : h.type === "timer" ? `Vandaag: ${h.t.toLowerCase()} als eerste blok van de dag, ${h.target} min.`
        : h.type === "limit" ? `Vandaag: ${h.t.toLowerCase()} onder de ${f(h.target)} houden.`
        : h.type === "time" ? `Vandaag: ${h.t.toLowerCase()} vóór ${f(h.target)}.`
        : `Vandaag: ${h.t.toLowerCase()} als eerste afvinken.`;
    }

    return {
      day, empty, score, good, bad, tips: uniqTips, focus,
      stats: { hDone, hTot: habits.length, rDone, rTot, resisted, urges: urges.length, relapse: relapses.length > 0, checkin: !!ci },
      label: dateOf(day).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })
    };
  }

  /* One-line version for the morning push (no journal, triggers or notes) */
  function summary(day) {
    const r = compute(day);
    if (r.empty) return null;
    const g = r.good.find(x => x.short !== "clean" && !x.neutral) || r.good[0], b = r.bad.find(x => x.short !== "terugval");
    const body = [g ? "✅ " + g.short : "", b ? "⚠️ " + b.short : ""].filter(Boolean).join(" · ");
    return {
      day,
      title: `Recap: ${r.score}%${r.stats.hTot ? ` · ${r.stats.hDone}/${r.stats.hTot} gewoontes` : ""}`.slice(0, 80),
      body: (body || "Bekijk hoe je dag ging.").slice(0, 160)
    };
  }

  /* ---------- UI ---------- */
  const scoreColor = s => s >= 75 ? "#34d399" : s >= 45 ? "#fbbf24" : "#ff4d6d";
  const scoreWord = s => s >= 85 ? "Topdag! 🏆" : s >= 70 ? "Sterke dag 💪" : s >= 45 ? "Oké dag, er zit meer in" : "Zware dag, morgen beter";

  function show(day = yesterday(), { auto } = {}) {
    const r = compute(day);
    if (r.empty) { if (!auto) FX.toast("Nog geen gegevens voor deze dag"); return; }
    const prev = compute(Store.dayKey(dateOf(day).getTime() - DAY / 2));
    const delta = prev.empty ? null : r.score - prev.score;
    const C = 2 * Math.PI * 72;
    const item = (x, cls) => `<div class="rc-item ${cls}" data-rc><span class="rc-e">${esc(x.e)}</span><span>${esc(x.t)}</span></div>`;

    fullscreen(`
      <div class="fs-top"><button class="icon-btn" data-close>${closeIcon}</button><span class="small muted">Recap</span><span style="width:44px"></span></div>
      <div class="rc-scroll">
        <div class="eyebrow" style="text-align:center;margin-top:8px" data-rc>${auto ? "Goedemorgen · " : ""}${esc(r.label)}</div>
        <div class="rc-score" data-rc>
          <svg viewBox="0 0 170 170" width="170" height="170"><circle cx="85" cy="85" r="72" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="12"/>
            <circle data-arc cx="85" cy="85" r="72" fill="none" stroke="${scoreColor(r.score)}" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}" transform="rotate(-90 85 85)"/></svg>
          <div class="rc-num"><b data-num>0</b><span>score</span></div>
        </div>
        <h2 style="text-align:center;font-size:24px" data-rc>${scoreWord(r.score)}</h2>
        ${delta != null ? `<p class="small" style="text-align:center;margin-top:4px;color:${delta >= 0 ? "var(--ok)" : "var(--warn)"}" data-rc>${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} t.o.v. de dag ervoor</p>` : ""}
        <div class="rc-stats" data-rc>
          <div><b>${r.stats.hDone}/${r.stats.hTot}</b><span>gewoontes</span></div>
          <div><b>${r.stats.rDone}/${r.stats.rTot}</b><span>reset</span></div>
          <div><b>${r.stats.relapse ? "↺" : "✓"}</b><span>${r.stats.relapse ? "terugval" : "clean"}</span></div>
          <div><b>${r.stats.checkin ? "✓" : "–"}</b><span>check-in</span></div>
        </div>
        ${r.good.length ? `<h3 class="rc-h" data-rc>Wat ging goed</h3>${r.good.map(x => item(x, "good")).join("")}` : ""}
        ${r.bad.length ? `<h3 class="rc-h" data-rc>Kan beter</h3>${r.bad.map(x => item(x, "bad")).join("")}` : ""}
        ${r.tips.length ? `<h3 class="rc-h" data-rc>Tips</h3>${r.tips.map(t => `<div class="rc-tip" data-rc><span>💡</span><span>${esc(t)}</span></div>`).join("")}` : ""}
        <div class="rc-focus" data-rc><div class="eyebrow">Focus voor vandaag</div><div>${esc(r.focus)}</div></div>
        <button class="btn" data-close style="margin-top:20px" data-rc>Start de dag</button>
        <div style="height:24px"></div>
      </div>`, {
      bg: "radial-gradient(circle at 50% 18%, #1d1650 0%, #0a0820 55%, #05050a 100%)",
      onMount(el, close) {
        el.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", close));
        const tl = gsap.timeline({ delay: 0.15 });
        tl.from($$("[data-rc]", el), { y: 18, opacity: 0, duration: 0.5, stagger: 0.045, ease: "power3.out", clearProps: "transform,opacity" }, 0);
        tl.to($("[data-arc]", el), { attr: { "stroke-dashoffset": C * (1 - r.score / 100) }, duration: 1.4, ease: "power3.out" }, 0.2);
        const o = { v: 0 }, num = $("[data-num]", el);
        tl.to(o, { v: r.score, duration: 1.4, ease: "power3.out", onUpdate: () => { num.textContent = Math.round(o.v); } }, 0.2);
        if (r.score >= 85) tl.call(() => { confetti(90); Sound.success(); haptic([15, 40, 15]); }, null, 1.3);
      }
    });
    S().recapSeen = Store.dayKey();
    Store.save();
  }

  /* Show automatically on the first open of a new day (after 04:00) */
  function maybeAuto() {
    const s = S();
    if (!s.onboarded || s.recapSeen === Store.dayKey() || new Date().getHours() < 4) return false;
    if ($("#fs-root").children.length || $("#sheet-root").children.length) return false;
    const r = compute(yesterday());
    if (r.empty) { s.recapSeen = Store.dayKey(); Store.save(); return false; }
    show(yesterday(), { auto: true });
    return true;
  }

  function cardHtml() {
    const r = compute(yesterday());
    if (r.empty) return "";
    return `<button class="card tap rc-card" data-action="recap" data-anim>
      <span class="rc-mini" style="--c:${scoreColor(r.score)};--p:${r.score / 100}"><b>${r.score}</b></span>
      <span style="flex:1;text-align:left"><div style="font-weight:600">Recap van gisteren</div><div class="small muted">${r.stats.hDone}/${r.stats.hTot} gewoontes · ${r.good.length} goed · ${r.bad.length} kan beter</div></span>
      <span class="muted">›</span></button>`;
  }

  window.Recap = { compute, summary, show, maybeAuto, cardHtml, yesterday };
})();
