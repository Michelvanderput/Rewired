/* Risk moments: when, where and in which mood urges and relapses happen.
   After 10 logs the top 3 two-hour windows are shown, a warning card appears on home during such a window,
   and (with push on) a reminder arrives 15 minutes before it starts. */
(function () {
  const { esc } = FX;
  const S = () => Store.s;
  const NEED = 10, DAYS = 60, MAX = 3;

  const events = () => {
    const since = Date.now() - DAYS * Store.DAY;
    return S().urges.concat(S().relapses).filter(e => e.ts >= since);
  };
  const hh = h => String(h % 24).padStart(2, "0") + ":00";
  const top = (list, key) => {
    const c = {};
    list.forEach(e => { if (e[key]) c[e[key]] = (c[e[key]] || 0) + 1; });
    const best = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return best && best[1] >= 2 ? best[0] : "";
  };

  /* Top two-hour windows that do not overlap, each with at least 2 logs */
  function moments() {
    const ev = events();
    if (ev.length < NEED) return [];
    const per = Array.from({ length: 24 }, () => []);
    ev.forEach(e => per[new Date(e.ts).getHours()].push(e));
    const win = h => per[h].concat(per[(h + 1) % 24]);
    const taken = new Set(), out = [];
    for (let n = 0; n < MAX; n++) {
      let best = -1;
      for (let h = 0; h < 24; h++) {
        if (taken.has(h) || taken.has((h + 1) % 24)) continue;
        // on a tie, prefer the window that starts at the busiest hour (15:00–17:00 rather than 14:00–16:00)
        if (best < 0 || win(h).length > win(best).length || (win(h).length === win(best).length && per[h].length > per[best].length)) best = h;
      }
      if (best < 0 || win(best).length < 2) break;
      const list = win(best);
      taken.add(best); taken.add((best + 1) % 24);
      const weekend = list.filter(e => [0, 6].includes(new Date(e.ts).getDay())).length / list.length;
      out.push({
        from: best, to: (best + 2) % 24, count: list.length, label: `${hh(best)}–${hh(best + 2)}`,
        place: top(list, "place"), feeling: top(list, "feeling"), trigger: top(list, "trigger"),
        weekend: weekend >= 0.6, resisted: list.filter(e => e.resisted).length
      });
    }
    return out;
  }

  const detail = m => [m.place && "meestal " + m.place.toLowerCase(), m.feeling && m.feeling.toLowerCase(), m.trigger && !m.feeling && m.trigger.toLowerCase(), m.weekend && "vooral in het weekend"].filter(Boolean).join(" · ");

  const FEELING_TIPS = {
    Verveeld: "Leg nu iets klaar wat je handen bezighoudt: een boek, gitaar, een wandeling.",
    Gestrest: "Doe eerst 2 minuten ademhaling. Stress zoekt een snelle uitweg, geef hem een andere.",
    Eenzaam: "Stuur iemand een berichtje of bel kort. Verbinding is het echte medicijn.",
    Moe: "Moe = minder wilskracht. Ga eerder slapen en laat je telefoon buiten de slaapkamer.",
    Verdrietig: "Schrijf drie zinnen in je dagboek over wat je voelt. Voelen is beter dan verdoven.",
    Boos: "Beweeg: 20 push-ups of een rondje buiten. Boosheid is energie, gebruik hem.",
    Onrustig: "Zet een timer van 10 minuten en wacht af. De golf zakt vanzelf."
  };
  const PLACE_TIPS = {
    Slaapkamer: "Leg je telefoon voor dit moment buiten de slaapkamer.",
    "Bank / woonkamer": "Zit niet alleen met je telefoon op de bank: ga naar buiten of zet iets op met anderen.",
    Badkamer: "Neem je telefoon niet mee de badkamer in.",
    Bureau: "Zet een site-blocker aan en werk met de deur open.",
    "Alleen thuis": "Plan iets buiten de deur voor dit tijdstip."
  };
  const tip = m => FEELING_TIPS[m.feeling] || PLACE_TIPS[m.place] || "Bedenk nu wat je op dat moment in plaats daarvan doet. Een plan maakt het makkelijker.";

  /* Are we inside (or 15 minutes before) one of the windows right now? */
  function current(d = new Date()) {
    const min = d.getHours() * 60 + d.getMinutes();
    return moments().find(m => {
      const a = (m.from * 60 - 15 + 1440) % 1440, b = (m.to * 60) % 1440;
      return a < b ? min >= a && min < b : min >= a || min < b;
    }) || null;
  }

  function homeCardHtml() {
    const m = current();
    if (!m) return "";
    return `<div class="card risk-card" data-anim>
      <div class="eyebrow" style="color:var(--warn)">⚠️ Jouw risicomoment · ${m.label}</div>
      <div style="font-weight:600;margin-top:6px">${esc(detail(m) || "Rond deze tijd kwam drang vaak op")}</div>
      <p class="small muted" style="margin-top:6px">${esc(tip(m))}</p>
      <div class="row" style="gap:8px;margin-top:12px"><button class="btn sm" data-action="breath">🌬️ Ademhaling</button><button class="btn sm ghost" data-action="panic">Noodmodus</button></div>
    </div>`;
  }

  function progressHtml() {
    const ev = events(), list = moments();
    if (ev.length < NEED) {
      return `<div class="small muted">Nog ${NEED - ev.length} ${NEED - ev.length === 1 ? "log" : "logs"} tot je persoonlijke risicomomenten zichtbaar worden. Log bij elke drang ook waar je bent en hoe je je voelt.</div>
        <div class="bar" style="margin-top:12px"><i style="width:${(ev.length / NEED) * 100}%"></i></div>`;
    }
    if (!list.length) return `<div class="small muted">Nog geen duidelijk patroon: je drang komt verspreid over de dag.</div>`;
    return list.map((m, i) => `<div class="risk-row">
      <span class="risk-n">${i + 1}</span>
      <span style="flex:1;min-width:0"><div style="font-weight:600">${m.label} <span class="small muted">· ${m.count}× in ${DAYS} dagen</span></div>
        ${detail(m) ? `<div class="small muted">${esc(detail(m))}</div>` : ""}
        <div class="small" style="margin-top:4px">${esc(tip(m))}</div></span></div>`).join("") +
      `<p class="small muted" style="margin-top:12px">${Push.prefs().subscribed ? (Push.prefs().risk !== false ? "Je krijgt 15 minuten vooraf een melding." : "Waarschuwing vooraf staat uit (Profiel → Meldingen).") : "Zet meldingen aan om 15 minuten vooraf gewaarschuwd te worden."}</p>`;
  }

  /* For the push server: up to 3 reminders, 15 minutes before each window */
  function pushReminders() {
    const out = {}, labels = [];
    moments().forEach((m, i) => {
      const t = (m.from * 60 - 15 + 1440) % 1440;
      out["risk" + i] = { on: true, time: String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0") };
      labels.push({ label: m.label, detail: detail(m).slice(0, 80), tip: tip(m).slice(0, 120) });
    });
    return { reminders: out, risks: labels };
  }

  window.Risk = { moments, current, homeCardHtml, progressHtml, pushReminders, detail, tip, NEED };
})();
