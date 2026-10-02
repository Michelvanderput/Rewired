/* Rewired – main app: onboarding, tabs, views, sheets */
(function () {
  const { $, $$, esc, haptic, toast, confetti, countUp, staggerIn, sheet, fullscreen, fmtDur, relTime, checkIcon } = FX;
  const S = () => Store.s;
  const DAY = Store.DAY;
  let tab = "home";
  let ticker = null;

  const ICON_BG = {
    violet: "background:rgba(124,92,255,.18)",
    cyan: "background:rgba(34,211,238,.16)",
    pink: "background:rgba(244,114,182,.16)",
    green: "background:rgba(52,211,153,.16)",
    red: "background:rgba(255,77,109,.16)",
    amber: "background:rgba(251,191,36,.16)"
  };

  const todayQuote = () => {
    const d = Math.floor(Date.now() / DAY);
    return DATA.quotes[d % DATA.quotes.length];
  };

  /* ====================================================== */
  /*                         VIEWS                          */
  /* ====================================================== */

  function viewHome() {
    const s = S();
    const days = Store.streakDays();
    const next = Store.nextMilestone();
    const prev = Store.prevMilestoneDay();
    const toNext = next.d * DAY - Store.streakMs();
    const ringPct = Math.min(1, (Store.streakMs() - prev * DAY) / ((next.d - prev) * DAY));
    const doneReset = s.reset[Store.dayKey()] || [];
    const q = todayQuote();
    const hour = new Date().getHours();
    const greet = hour < 6 ? "Goedenacht" : hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";
    const checked = !!s.checkins[Store.dayKey()];

    return `
      <header class="page-head" data-anim>
        <div>
          <div class="eyebrow">${new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" })}</div>
          <h1>${greet}${s.name ? ", " + esc(s.name) : ""}</h1>
        </div>
      </header>
      ${Push.homeCardHtml()}
      ${Risk.homeCardHtml()}
      ${Rewards.recoveryCardHtml()}

      <div class="card hero" data-anim>
        <div class="orb-wrap">
          <svg class="ring" viewBox="0 0 250 250" width="250" height="250">
            <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>
            <circle cx="125" cy="125" r="118" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="8"/>
            <circle data-ring cx="125" cy="125" r="118" fill="none" stroke="url(#rg)" stroke-width="8" stroke-linecap="round" stroke-dasharray="741.4" stroke-dashoffset="741.4" data-pct="${ringPct}"/>
          </svg>
          <div class="orb" data-orb></div>
          <div class="orb-content">
            <div class="streak-num" data-days>${days}</div>
            <div class="streak-lbl">${days === 1 ? "dag vrij" : "dagen vrij"}</div>
            <div class="streak-timer" data-timer>${fmtDur(Store.streakMs())}</div>
          </div>
        </div>
        <div class="hero-sub">Volgende: <b style="color:#fff">${next.e} ${next.t}</b> · nog ${Math.ceil(toNext / DAY)} ${Math.ceil(toNext / DAY) === 1 ? "dag" : "dagen"}</div>
        <div class="brain-bar">
          <div class="row between small" style="margin-bottom:8px"><span class="muted">🧠 Brein herbedraad</span><b data-rewire>0%</b></div>
          <div class="bar"><i data-rewire-bar></i></div>
        </div>
      </div>

      <div class="grid3" style="margin-top:12px">
        <div class="card stat" data-anim><div class="ico" style="${ICON_BG.violet}">⚡</div><div class="v" data-count="${Store.discipline()}">0</div><div class="l">Discipline</div></div>
        <div class="card stat" data-anim><div class="ico" style="${ICON_BG.green}">🛡️</div><div class="v" data-count="${Store.resisted()}">0</div><div class="l">Weerstaan</div></div>
        <div class="card stat" data-anim><div class="ico" style="${ICON_BG.amber}">🏆</div><div class="v" data-count="${Store.bestDays()}">0</div><div class="l">Beste streak</div></div>
      </div>

      ${Recap.cardHtml()}
      ${Rewards.cardHtml()}
      ${AppTrack.cardHtml()}

      <div class="section-title" data-anim><h3>Snelle acties</h3></div>
      <div class="qa" data-anim>
        <button data-action="checkin"><span class="qi" style="${checked ? ICON_BG.green : ICON_BG.violet}">${checked ? "✅" : "😊"}</span>Check-in</button>
        <button data-action="urge"><span class="qi" style="${ICON_BG.cyan}">🌊</span>Drang</button>
        <button data-action="journal"><span class="qi" style="${ICON_BG.pink}">✍️</span>Dagboek</button>
        <button data-action="relapse"><span class="qi" style="${ICON_BG.red}">↺</span>Terugval</button>
      </div>

      <div class="section-title" data-anim><h3>Dagelijkse Dopamine Reset</h3><span class="link" data-reset-count>${doneReset.length}/${DATA.resetTasks.length}</span></div>
      <div class="card flush" data-anim>
        <div style="padding:16px 16px 4px"><div class="bar"><i data-reset-bar style="width:${(doneReset.length / DATA.resetTasks.length) * 100}%"></i></div></div>
        ${DATA.resetTasks.map(t => `
          <button class="list-item ${doneReset.includes(t.id) ? "done" : ""}" data-toggle-reset="${t.id}" style="width:100%;text-align:left">
            <span class="li-ico">${t.e}</span>
            <span class="li-body"><div class="li-title">${t.t}</div><div class="li-sub">${t.s}</div></span>
            <span class="check">${checkIcon}</span>
          </button>`).join("")}
      </div>

      <div class="section-title" data-anim><h3>Gewoontes vandaag</h3><span><button class="link" data-action="addHabit" style="margin-right:14px">＋ Nieuw</button><button class="link" data-action="habits">Beheren</button></span></div>
      <div class="card flush" data-anim>
        ${Habits.listHtml()}
      </div>

      <div class="card" style="margin-top:26px" data-anim>
        <div class="eyebrow">Gedachte van de dag</div>
        <div class="quote">“${esc(q[0])}”</div>
        <div class="quote-by">— ${esc(q[1])}</div>
      </div>
    `;
  }


  function viewTools() {
    const tile = (action, e, title, sub, color, glow, wide) => `
      <button class="card tap tile ${wide ? "wide" : ""}" data-action="${action}" data-anim>
        <span class="glow" style="background:${glow}"></span>
        <span class="tile-ico" style="${ICON_BG[color]}">${e}</span>
        <span><h4>${title}</h4><p>${sub}</p></span>
      </button>`;
    return `
      <header class="page-head" data-anim><div><div class="eyebrow">Jouw arsenaal</div><h1>Tools</h1></div></header>
      <button class="card tap tile wide" data-action="light" data-anim style="min-height:170px;background:linear-gradient(135deg,rgba(124,92,255,.25),rgba(34,211,238,.12))">
        <span class="glow" style="background:#7c5cff;width:220px;height:220px;opacity:.5"></span>
        <span class="tile-ico" style="${ICON_BG.violet}">💡</span>
        <span><h4 style="font-size:22px">Lichttherapie</h4><p>NeuroPulse sessies · doorbreek de drang in 1–5 minuten</p></span>
      </button>
      <div class="grid2" style="margin-top:12px">
        ${tile("breath", "🌬️", "Ademhaling", "Box, 4-7-8, zucht", "cyan", "#22d3ee")}
        ${tile("meditate", "🧘", "Meditatie", "Body scan & rust", "pink", "#f472b6")}
        ${tile("surf", "🌊", "Urge surfing", "Rijd de golf uit", "cyan", "#0ea5e9")}
        ${tile("panic", "🚨", "Noodmodus", "Directe hulp", "red", "#ff2d55")}
        ${tile("habits", "✅", "Gewoontes", "Bouw consistentie", "green", "#34d399")}
        ${tile("journal", "✍️", "Dagboek", "Reflecteer", "amber", "#fbbf24")}
        ${tile("urge", "📍", "Drang loggen", "Vind je patronen", "violet", "#7c5cff")}
        ${tile("blocker", "🚫", "Blocker", "Blokkeer sites op iPhone", "red", "#f43f5e")}
        ${tile("apps", "📱", "App-gebruik", "Tel hoe vaak je apps opent", "cyan", "#22d3ee")}
        ${tile("rewards", "🎁", "Beloningen", "Vrijspelen met clean dagen", "amber", "#fbbf24")}
      </div>
    `;
  }

  function viewProgress() {
    const s = S();
    const cal = calendarHtml();
    const urgeDays = [];
    for (let i = 13; i >= 0; i--) {
      const k = Store.dayKey(Date.now() - i * DAY);
      const list = s.urges.filter(u => Store.dayKey(u.ts) === k);
      urgeDays.push({ k, n: list.length, r: list.filter(u => u.resisted).length, label: new Date(Date.now() - i * DAY).getDate() });
    }
    const max = Math.max(3, ...urgeDays.map(d => d.n));
    const bw = 100 / 14;
    const chart = `<svg class="chart" viewBox="0 0 100 60" preserveAspectRatio="none">
      ${urgeDays.map((d, i) => `
        <rect x="${i * bw + bw * 0.2}" y="${52 - (d.n / max) * 48}" width="${bw * 0.6}" height="${(d.n / max) * 48 || 0.6}" rx="1" fill="rgba(255,77,109,.55)" data-grow/>
        <rect x="${i * bw + bw * 0.2}" y="${52 - (d.r / max) * 48}" width="${bw * 0.6}" height="${(d.r / max) * 48}" rx="1" fill="url(#cg)" data-grow/>`).join("")}
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>
    </svg>
    <div class="row between small muted" style="margin-top:4px">${urgeDays.filter((_, i) => i % 3 === 0 || i === 13).map(d => `<span>${d.label}</span>`).join("")}</div>`;

    const trig = {};
    s.urges.concat(s.relapses).forEach(u => { if (u.trigger) trig[u.trigger] = (trig[u.trigger] || 0) + 1; });
    const trigArr = Object.entries(trig).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const tmax = Math.max(1, ...trigArr.map(t => t[1]));

    const tod = [["🌅 Ochtend", 6, 12], ["☀️ Middag", 12, 18], ["🌆 Avond", 18, 23], ["🌙 Nacht", 23, 6]];
    const todCounts = tod.map(([n, a, b]) => [n, s.urges.concat(s.relapses).filter(u => { const h = new Date(u.ts).getHours(); return a < b ? h >= a && h < b : h >= a || h < b; }).length]);
    const todMax = Math.max(1, ...todCounts.map(t => t[1]));
    const peak = todCounts.slice().sort((a, b) => b[1] - a[1])[0];

    const days = Store.bestDays();
    return `
      <header class="page-head" data-anim><div><div class="eyebrow">Inzichten</div><h1>Voortgang</h1></div>
        <button class="btn ghost sm" data-action="share">Delen</button></header>

      <div class="grid2">
        <div class="card stat" data-anim><div class="ico" style="${ICON_BG.violet}">🔥</div><div class="v" data-count="${Store.streakDays()}">0</div><div class="l">Huidige streak (dagen)</div></div>
        <div class="card stat" data-anim><div class="ico" style="${ICON_BG.amber}">🏆</div><div class="v" data-count="${days}">0</div><div class="l">Beste streak</div></div>
        <div class="card stat" data-anim><div class="ico" style="${ICON_BG.green}">🛡️</div><div class="v" data-count="${Store.resisted()}">0</div><div class="l">Drang weerstaan</div></div>
        <div class="card stat" data-anim><div class="ico" style="${ICON_BG.cyan}">🧘</div><div class="v" data-count="${s.sessions.minutes || 0}">0</div><div class="l">Minuten in sessies</div></div>
      </div>

      <div class="section-title" data-anim><h3>Kalender</h3><span class="small muted">5 weken</span></div>
      <div class="card" data-anim>${cal}
        <div class="legend"><span><i style="background:rgba(52,211,153,.5)"></i>Clean</span><span><i style="background:rgba(124,92,255,.6)"></i>Check-in</span><span><i style="background:rgba(255,77,109,.6)"></i>Terugval</span></div>
      </div>

      <div class="section-title" data-anim><h3>Drang · 14 dagen</h3></div>
      <div class="card" data-anim>${chart}
        <div class="legend"><span><i style="background:#7c5cff"></i>Weerstaan</span><span><i style="background:rgba(255,77,109,.55)"></i>Totaal gelogd</span></div>
      </div>

      <div class="section-title" data-anim><h3>Gewoontes · 7 dagen</h3><button class="link" data-action="habits">Beheren</button></div>
      <div class="card" data-anim>${Habits.weekHtml()}</div>

      ${AppTrack.configured() ? `<div class="section-title" data-anim><h3>App-gebruik</h3><button class="link" data-action="apps">Details</button></div>${AppTrack.cardHtml()}` : ""}

      <div class="section-title" data-anim><h3>Triggers</h3></div>
      <div class="card" data-anim>
        ${trigArr.length ? trigArr.map(([n, c]) => `<div class="hbar"><span class="n">${esc(n)}</span><div class="bar"><i data-w="${(c / tmax) * 100}"></i></div><span class="c">${c}</span></div>`).join("") : `<div class="empty">Log je drang om je triggers te ontdekken.</div>`}
      </div>

      <div class="section-title" data-anim><h3>Jouw risicomomenten</h3><span class="small muted">top 3</span></div>
      <div class="card" data-anim data-risk>${Risk.progressHtml()}</div>

      <div class="section-title" data-anim><h3>Per dagdeel</h3></div>
      <div class="card" data-anim>
        ${todCounts.map(([n, c]) => `<div class="hbar"><span class="n">${n}</span><div class="bar"><i data-w="${(c / todMax) * 100}"></i></div><span class="c">${c}</span></div>`).join("")}
        ${peak[1] > 0 ? `<p class="small muted" style="margin-top:14px">Je bent het kwetsbaarst in de <b style="color:#fff">${peak[0].split(" ")[1].toLowerCase()}</b>. Plan voor dat moment een vervangende activiteit.</p>` : ""}
      </div>

      <div class="section-title" data-anim><h3>Mijlpalen</h3></div>
      <div class="badges">
        ${DATA.milestones.map(m => `<div class="card badge ${days >= m.d ? "got" : ""}" data-anim><div class="bi">${m.e}</div><div class="bt">${m.t}</div><div class="bs">${m.s}</div></div>`).join("")}
      </div>

      <div class="section-title" data-anim><h3>Dagboek</h3><button class="link" data-action="journal">Nieuw</button></div>
      <div class="card flush" data-anim>
        ${s.journal.length ? s.journal.slice().reverse().slice(0, 10).map(j => `
          <div class="list-item"><span class="li-ico">${j.mood || "📝"}</span><span class="li-body"><div class="li-sub">${relTime(j.ts)}</div><div style="font-size:15px;margin-top:2px;white-space:pre-wrap">${esc(j.text)}</div></span></div>`).join("") : `<div class="empty">Nog geen notities.</div>`}
      </div>

      <div class="section-title" data-anim><h3>Terugvallen</h3></div>
      <div class="card flush" data-anim>
        ${s.relapses.length ? s.relapses.slice().reverse().slice(0, 10).map(r => `
          <div class="list-item"><span class="li-ico">↺</span><span class="li-body"><div class="li-title">Na ${Math.floor(r.streakMs / DAY)} dagen</div><div class="li-sub">${relTime(r.ts)}${r.trigger ? " · " + esc(r.trigger) : ""}</div>${r.note ? `<div class="small" style="margin-top:4px">${esc(r.note)}</div>` : ""}</span></div>`).join("") : `<div class="empty">Geen terugvallen. Ga zo door. 💪</div>`}
      </div>
    `;
  }

  function calendarHtml() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const dow = (today.getDay() + 6) % 7; // Monday = 0
    const start = new Date(today.getTime() - (28 + dow) * DAY);
    let cells = ["M", "D", "W", "D", "V", "Z", "Z"].map(d => `<div class="h">${d}</div>`).join("");
    for (let i = 0; i < 35; i++) {
      const d = new Date(start.getTime() + i * DAY + 3600000 * 12);
      const k = Store.dayKey(d);
      const future = d > new Date();
      const st = future ? "" : Store.dayStatus(k);
      cells += `<div class="d ${st} ${k === Store.dayKey() ? "today" : ""}" data-cal style="${future ? "opacity:.3" : ""}">${d.getDate()}</div>`;
    }
    return `<div class="cal">${cells}</div>`;
  }

  function viewProfile() {
    const s = S();
    const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
    const toggle = (key, label, sub) => `
      <div class="list-item"><span class="li-body"><div class="li-title">${label}</div><div class="li-sub">${sub}</div></span>
        <button class="seg" style="width:120px" data-setting="${key}"><span style="flex:1;padding:8px 0;border-radius:10px;text-align:center;font-size:14px;${s.settings[key] ? "background:rgba(255,255,255,.12)" : "color:var(--muted)"}">Aan</span><span style="flex:1;padding:8px 0;border-radius:10px;text-align:center;font-size:14px;${!s.settings[key] ? "background:rgba(255,255,255,.12)" : "color:var(--muted)"}">Uit</span></button></div>`;
    return `
      <header class="page-head" data-anim><div><div class="eyebrow">Jij</div><h1>Profiel</h1></div></header>
      <div class="card" data-anim style="text-align:center;padding:26px 18px">
        <div style="width:84px;height:84px;border-radius:50%;margin:0 auto 12px;background:var(--grad);display:grid;place-items:center;font-family:var(--display);font-size:36px;font-weight:700" data-avatar>${esc((s.name || "R")[0].toUpperCase())}</div>
        <h2 style="font-size:24px">${esc(s.name || "Rewired")}</h2>
        <p class="small muted" style="margin-top:4px">Gestart op ${new Date(s.firstStart || s.startDate).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</p>
        <div class="grid3" style="margin-top:18px">
          <div><div style="font-family:var(--display);font-size:22px;font-weight:700">${Store.streakDays()}</div><div class="small muted">Streak</div></div>
          <div><div style="font-family:var(--display);font-size:22px;font-weight:700">${(s.sessions.light || 0) + (s.sessions.breath || 0) + (s.sessions.meditate || 0)}</div><div class="small muted">Sessies</div></div>
          <div><div style="font-family:var(--display);font-size:22px;font-weight:700">${s.lessonsDone.length}</div><div class="small muted">Lessen</div></div>
        </div>
      </div>

      <div class="section-title" data-anim><h3>Account & opslag</h3></div>
      <div data-sync data-anim></div>

      ${!standalone ? `<div class="card" data-anim style="margin-top:12px;border-color:rgba(34,211,238,.4)">
        <div style="font-weight:600">📲 Installeer op je iPhone</div>
        <p class="small muted" style="margin-top:6px">Open in Safari, tik op <b style="color:#fff">Deel</b> <span style="display:inline-block;vertical-align:-3px">⬆️</span> en kies <b style="color:#fff">Zet op beginscherm</b>. Dan werkt Rewired als een echte app, fullscreen en offline.</p>
      </div>` : ""}

      <div class="section-title" data-anim><h3>Meldingen</h3></div>
      <div data-push data-anim></div>

      <div class="section-title" data-anim><h3>Waarom ik dit doe</h3><button class="link" data-action="editReasons">Wijzig</button></div>
      <div class="card" data-anim>
        ${s.reasons.length ? s.reasons.map(r => `<div class="row" style="padding:6px 0"><span>💡</span><span>${esc(r)}</span></div>`).join("") : `<div class="empty">Voeg je redenen toe. Je ziet ze terug in de noodmodus.</div>`}
        ${s.pledge ? `<div class="split"></div><div class="eyebrow">Mijn belofte</div><p class="quote" style="font-size:17px">“${esc(s.pledge)}”</p>` : ""}
        ${s.signature ? `<img src="${s.signature}" alt="Handtekening" style="width:160px;margin-top:10px;opacity:.85">` : ""}
      </div>

      <div class="section-title" data-anim><h3>Instellingen</h3></div>
      <div class="card flush" data-anim>
        <div class="list-item"><span class="li-body"><div class="li-title">Naam</div></span><input class="field" style="width:55%;padding:10px 12px" data-name value="${esc(s.name)}" placeholder="Je naam"></div>
        ${toggle("sound", "Geluid", "UI-geluiden en ambient audio")}
        ${toggle("haptics", "Haptische feedback", "Trillingen bij acties")}
        ${window.Monitor && Monitor.available() ? toggle("errors", "Foutmeldingen delen", "Stuurt bij een crash alleen de technische foutmelding mee (nooit je dagboek, naam of gewoontes), zodat bugs opgelost kunnen worden") : ""}
        ${toggle("calm", "Minder beweging", "Rustige overgangen, geen confetti of zwevende achtergrond. Staat ook aan als iOS 'Verminder beweging' aan staat")}
        <button class="list-item" style="width:100%;text-align:left" data-action="editStart"><span class="li-body"><div class="li-title">Streak startmoment</div><div class="li-sub">${relTime(s.startDate)}</div></span><span class="muted">›</span></button>
      </div>

      <div class="section-title" data-anim><h3>Gegevens</h3></div>
      <div class="card flush" data-anim>
        <button class="list-item" style="width:100%;text-align:left" data-action="export"><span class="li-ico">📤</span><span class="li-body"><div class="li-title">Back-up exporteren</div><div class="li-sub">Bewaar je data als bestand</div></span></button>
        <label class="list-item" style="width:100%;cursor:pointer"><span class="li-ico">📥</span><span class="li-body"><div class="li-title">Back-up importeren</div><div class="li-sub">Herstel vanaf een bestand</div></span><input type="file" accept="application/json,.json" data-import style="display:none"></label>
        <button class="list-item" style="width:100%;text-align:left" data-action="wipe"><span class="li-ico">🗑️</span><span class="li-body"><div class="li-title danger-text">Alles wissen op deze telefoon</div><div class="li-sub">Begin opnieuw${Sync.user ? " · je wordt uitgelogd, cloud-kopie blijft" : ""}</div></span></button>
      </div>

      <p class="small muted" style="text-align:center;margin-top:26px;line-height:1.6">Al je gegevens blijven privé op dit apparaat.<br>Rewired is een zelfhulp-tool en vervangt geen professionele hulp.<br>Hulp nodig? Bel <b>113</b> (0800-0113) bij crisis.</p>
    `;
  }

  const VIEWS = { home: viewHome, tools: viewTools, progress: viewProgress, learn: () => Learn.view(), profile: viewProfile };

  /* ====================================================== */
  /*                      RENDERING                         */
  /* ====================================================== */

  // stop infinite tweens (orb etc.) on nodes that are about to be removed
  function setView(v, html) {
    gsap.killTweensOf(v.querySelectorAll("*"));
    v.innerHTML = html;
  }

  function render(animate = true) {
    const v = $("#view");
    setView(v, VIEWS[tab]());
    afterRender(v, animate);
  }

  function afterRender(v, animate) {
    if (animate) staggerIn(v);
    $$("[data-count]", v).forEach(el => countUp(el, +el.dataset.count, { duration: animate ? 1.4 : 0.01 }));
    $$("[data-w]", v).forEach(el => gsap.to(el, { width: el.dataset.w + "%", duration: animate ? 1.2 : 0, ease: "power3.out", delay: animate ? 0.3 : 0 }));
    $$("[data-grow]", v).forEach((el, i) => gsap.from(el, { scaleY: 0, transformOrigin: "50% 100%", duration: 0.8, delay: 0.3 + i * 0.02, ease: "power3.out" }));
    $$("[data-cal]", v).forEach((el, i) => animate && gsap.from(el, { scale: 0, opacity: 0, duration: 0.4, delay: 0.2 + i * 0.012, ease: "back.out(2)" }));

    if (tab === "learn") Learn.after(v);
    if (tab === "profile") { Push.mount($("[data-push]", v)); Sync.mount($("[data-sync]", v)); }

    if (tab === "home") setTimeout(() => { Rewards.checkRecovery() || Rewards.checkUnlock(); }, 700);

    if (tab === "home") {
      const ring = $("[data-ring]", v);
      gsap.to(ring, { strokeDashoffset: 741.4 * (1 - +ring.dataset.pct), duration: animate ? 1.8 : 0, ease: "power3.out", delay: 0.2 });
      const orb = $("[data-orb]", v);
      if (!FX.calm()) {
        gsap.to(orb, { scale: 1.05, duration: 3, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(orb, { rotation: 360, duration: 30, repeat: -1, ease: "none" });
      }
      if (animate && !FX.calm()) gsap.from($("[data-days]", v), { scale: 0.4, opacity: 0, duration: 1.1, ease: "elastic.out(1,0.6)", delay: 0.2 });
      const pct = Store.rewirePct();
      countUp($("[data-rewire]", v), pct, { decimals: 1, suffix: "%", duration: animate ? 1.6 : 0.01 });
      gsap.to($("[data-rewire-bar]", v), { width: pct + "%", duration: animate ? 1.6 : 0, ease: "power3.out", delay: 0.2 });
    }
  }

  /* 00:00 → habits, Dopamine Reset and check-in start fresh; running timers are split at midnight */
  let lastKey = Store.dayKey();
  function newDay() {
    if (Store.dayKey() === lastKey) return;
    lastKey = Store.dayKey();
    Habits.rollover();
    if (!$("#sheet-root").children.length) render(false);
    setTimeout(() => Recap.maybeAuto(), 600);
  }

  function startTicker() {
    clearInterval(ticker);
    let lastDays = Store.streakDays();
    ticker = setInterval(() => {
      if (Store.dayKey() !== lastKey) newDay();
      if (tab !== "home") return;
      const t = $("[data-timer]");
      if (t) t.textContent = fmtDur(Store.streakMs());
      const d = Store.streakDays();
      if (d !== lastDays) { lastDays = d; render(false); checkMilestone(); }
    }, 1000);
  }

  let switchTl = null;
  function switchTab(next) {
    if (next === tab) { $("#view").scrollTo({ top: 0, behavior: "smooth" }); return; }
    const order = Object.keys(VIEWS);
    const dir = order.indexOf(next) > order.indexOf(tab) ? 1 : -1;
    tab = next;
    haptic(); Sound.tap();
    moveIndicator();
    const v = $("#view");
    // fast taps: finish the running switch immediately instead of stacking tweens
    if (switchTl) switchTl.kill();
    switchTl = gsap.timeline()
      .to(v, { opacity: 0, x: -10 * dir, duration: 0.12, ease: "power1.in" })
      .add(() => {
        v.scrollTop = 0;
        setView(v, VIEWS[tab]());
        afterRender(v, true);
      })
      .fromTo(v, { opacity: 0, x: 14 * dir }, { opacity: 1, x: 0, duration: 0.32, ease: "power3.out", clearProps: "transform" });
  }

  let indTl = null;
  function moveIndicator(instant) {
    const bar = $("#tabbar"), act = $(`.tab[data-tab="${tab}"]`), ind = $(".tab-indicator");
    $$(".tab").forEach(t => t.classList.toggle("active", t === act));
    const r = act.getBoundingClientRect(), br = bar.getBoundingClientRect();
    const x = r.left - br.left + r.width / 2 - 30;
    if (indTl) indTl.kill();
    if (instant) { gsap.set(ind, { x, scaleX: 1 }); return; }
    const dist = Math.abs(x - gsap.getProperty(ind, "x"));
    // liquid pill: stretches while travelling, settles on arrival
    indTl = gsap.timeline()
      .to(ind, { x, duration: 0.42, ease: "power3.inOut" }, 0)
      .to(ind, { scaleX: 1 + Math.min(dist / 180, 0.6), duration: 0.18, ease: "power2.out" }, 0)
      .to(ind, { scaleX: 1, duration: 0.3, ease: "power2.inOut" }, 0.16);
    gsap.fromTo(act.querySelector("svg"), { scale: 0.82 }, { scale: 1, duration: 0.45, ease: "back.out(3)", overwrite: true });
  }

  /* ====================================================== */
  /*                       SHEETS                           */
  /* ====================================================== */

  const moods = ["😫", "😕", "😐", "🙂", "😄"];

  function chipsHtml(list, selected = [], attr = "chip") {
    return `<div class="chips" data-chips="${attr}">${list.map(t => `<button class="chip ${selected.includes(t) ? "on" : ""}" data-v="${esc(t)}">${esc(t)}</button>`).join("")}</div>`;
  }
  function bindChips(root, attr, multi, cb) {
    const box = root.querySelector(`[data-chips="${attr}"]`);
    box.addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      haptic(); Sound.tap();
      if (!multi) $$(".chip", box).forEach(x => x !== b && x.classList.remove("on"));
      b.classList.toggle("on");
      gsap.fromTo(b, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
      cb($$(".chip.on", box).map(x => x.dataset.v));
    });
  }
  function bindMood(root, cb) {
    const row = root.querySelector(".mood-row");
    row.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      $$("button", row).forEach(x => { x.classList.toggle("on", x === b); if (x !== b) gsap.to(x, { scale: 1, rotation: 0, duration: 0.2 }); });
      haptic(); Sound.tap();
      gsap.fromTo(b, { rotation: -15 }, { rotation: 0, scale: 1.08, duration: 0.6, ease: "elastic.out(1,0.4)" });
      cb(b.dataset.v);
    });
  }

  function checkinSheet() {
    const cur = S().checkins[Store.dayKey()] || {};
    let mood = cur.mood || "", energy = cur.energy || 5;
    sheet(`
      <h2>Dagelijkse check-in</h2>
      <p class="sub">Hoe gaat het vandaag? Eerlijk zijn helpt je patronen te zien.</p>
      <label class="lbl">Stemming</label>
      <div class="mood-row">${moods.map(m => `<button data-v="${m}" class="${m === mood ? "on" : ""}">${m}</button>`).join("")}</div>
      <label class="lbl">Energie · <span data-ev>${energy}</span>/10</label>
      <input type="range" min="1" max="10" value="${energy}" data-energy>
      <label class="lbl">Notitie (optioneel)</label>
      <textarea class="field" data-note placeholder="Wat speelt er vandaag?">${esc(cur.note || "")}</textarea>
      <div style="margin-top:22px"><button class="btn" data-save>Opslaan</button></div>`, {
      onMount(sh, close) {
        bindMood(sh, v => mood = v);
        $("[data-energy]", sh).addEventListener("input", e => { energy = +e.target.value; $("[data-ev]", sh).textContent = energy; });
        $("[data-save]", sh).addEventListener("click", () => {
          if (!mood) { gsap.fromTo(".mood-row", { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" }); return; }
          Store.checkin({ mood, energy, note: $("[data-note]", sh).value.trim() });
          close(); Sound.success(); haptic([10, 30, 10]); confetti(40);
          toast("Check-in opgeslagen ✅"); refresh();
        });
      }
    });
  }

  function urgeSheet() {
    let intensity = 5, trigger = "", resisted = true, place = "", feeling = "";
    const left = Risk.NEED - S().urges.concat(S().relapses).length;
    sheet(`
      <h2>Drang loggen</h2>
      <p class="sub">Loggen zelf is al een vorm van controle. Je stapt uit de automatische piloot.</p>
      <label class="lbl">Intensiteit · <span data-iv>5</span>/10</label>
      <input type="range" min="1" max="10" value="5" data-int>
      <label class="lbl">Waar ben je?</label>
      ${chipsHtml(DATA.places, [], "place")}
      <label class="lbl">Hoe voel je je?</label>
      ${chipsHtml(DATA.feelings, [], "feel")}
      <label class="lbl">Trigger</label>
      ${chipsHtml(DATA.triggers, [], "trig")}
      ${left > 0 ? `<p class="small muted" style="margin-top:8px">Nog ${left} ${left === 1 ? "log" : "logs"} tot je persoonlijke risicomomenten zichtbaar worden.</p>` : ""}
      <label class="lbl">Resultaat</label>
      <div class="seg" data-res><button class="on" data-v="1">💪 Weerstaan</button><button data-v="0">Toegegeven</button></div>
      <label class="lbl">Notitie (optioneel)</label>
      <textarea class="field" data-note placeholder="Wat gebeurde er vlak ervoor?"></textarea>
      <div style="margin-top:22px"><button class="btn" data-save>Opslaan</button></div>`, {
      onMount(sh, close) {
        $("[data-int]", sh).addEventListener("input", e => {
          intensity = +e.target.value; const iv = $("[data-iv]", sh); iv.textContent = intensity;
          iv.style.color = intensity >= 8 ? "var(--danger)" : intensity >= 5 ? "var(--warn)" : "var(--ok)";
        });
        bindChips(sh, "trig", false, v => trigger = v[0] || "");
        bindChips(sh, "place", false, v => place = v[0] || "");
        bindChips(sh, "feel", false, v => feeling = v[0] || "");
        $("[data-res]", sh).addEventListener("click", e => {
          const b = e.target.closest("button"); if (!b) return;
          $$("[data-res] button", sh).forEach(x => x.classList.toggle("on", x === b));
          resisted = b.dataset.v === "1"; haptic(); Sound.tap();
        });
        $("[data-save]", sh).addEventListener("click", () => {
          const note = $("[data-note]", sh).value.trim();
          const before = Risk.moments().length;
          Store.logUrge({ intensity, trigger, resisted, note, place, feeling });
          close();
          if (!resisted) { setTimeout(() => relapseSheet(trigger, note, { place, feeling }), 350); return; }
          if (!before && Risk.moments().length) setTimeout(() => toast("📍 Je risicomomenten zijn nu zichtbaar bij Voortgang"), 3200);
          Sound.success(); haptic([10, 30, 10]); confetti(50);
          toast("Drang weerstaan. Sterk! 🛡️"); refresh();
          if (intensity >= 7) setTimeout(() => toast("Tip: probeer nu Lichttherapie of Ademhaling"), 3000);
        });
      }
    });
  }

  function relapseSheet(preTrigger = "", preNote = "", extra = {}) {
    let trigger = preTrigger;
    sheet(`
      <h2>Terugval registreren</h2>
      <p class="sub">Dit is geen mislukking, het is data. Je brein verliest zijn vooruitgang niet door één misstap. Wees mild voor jezelf en begin direct opnieuw.</p>
      <label class="lbl">Wat was de trigger?</label>
      ${chipsHtml(DATA.triggers, preTrigger ? [preTrigger] : [], "trig")}
      <label class="lbl">Wat leer je hiervan?</label>
      <textarea class="field" data-note placeholder="Wat doe ik de volgende keer anders?">${esc(preNote)}</textarea>
      <div style="margin-top:22px"><button class="btn danger" data-save>Reset mijn teller</button></div>
      <div style="margin-top:10px"><button class="btn ghost" data-cancel>Annuleren</button></div>`, {
      onMount(sh, close) {
        bindChips(sh, "trig", false, v => trigger = v[0] || "");
        $("[data-cancel]", sh).addEventListener("click", close);
        $("[data-save]", sh).addEventListener("click", () => {
          const old = Store.streakDays();
          Store.relapse(trigger, $("[data-note]", sh).value.trim(), extra);
          close();
          fullscreen(`
            <div class="fs-center">
              <div class="streak-num" data-n style="font-size:110px">${old}</div>
              <h2 style="font-size:30px;margin-top:20px" data-t>Nieuw begin.</h2>
              <p class="muted" style="margin-top:12px;font-size:17px;max-width:320px" data-s>Je ${old} ${old === 1 ? "dag" : "dagen"} zijn niet verloren: je hebt bewezen dat je het kunt. Val zeven keer, sta acht keer op.</p>
              <p style="margin-top:14px;font-size:15px;max-width:320px" data-s>🩹 Morgen is je <b>hersteldag</b>: 6 korte stappen om terug te veren. Je kunt vandaag al beginnen.</p>
            </div>
            <div class="fs-bottom" data-b><button class="btn" data-close>Ik begin opnieuw</button></div>`, {
            bg: "radial-gradient(circle at 50% 35%, #1b1450, #05050a 70%)",
            onMount(el, closeFs) {
              const n = $("[data-n]", el), o = { v: old };
              gsap.timeline()
                .to(o, { v: 0, duration: Math.min(2, 0.4 + old * 0.05), ease: "power2.inOut", onUpdate: () => n.textContent = Math.round(o.v) }, 0.4)
                .fromTo(n, { scale: 1 }, { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 }, ">")
                .from($$("[data-t],[data-s],[data-b]", el), { y: 24, opacity: 0, stagger: 0.12, duration: 0.6, ease: "power3.out" }, "<");
              Sound.soft();
              $("[data-close]", el).addEventListener("click", () => { closeFs(); refresh(); });
            }
          });
        });
      }
    });
  }

  function journalSheet() {
    let mood = "";
    sheet(`
      <h2>Dagboek</h2>
      <p class="sub">Schrijf op wat je voelt. Gedachten op papier verliezen hun grip.</p>
      <div class="mood-row">${moods.map(m => `<button data-v="${m}">${m}</button>`).join("")}</div>
      <label class="lbl">Wat speelt er?</label>
      <textarea class="field" data-text style="min-height:160px" placeholder="Vandaag voelde ik..."></textarea>
      <div class="chips" style="margin-top:12px" data-prompts>
        ${["Waar ben ik dankbaar voor?", "Wat triggerde me vandaag?", "Waar ben ik trots op?", "Wat heb ik nodig?"].map(p => `<button class="chip">${p}</button>`).join("")}
      </div>
      <div style="margin-top:22px"><button class="btn" data-save>Opslaan</button></div>`, {
      onMount(sh, close) {
        bindMood(sh, v => mood = v);
        const ta = $("[data-text]", sh);
        $("[data-prompts]", sh).addEventListener("click", e => {
          const b = e.target.closest(".chip"); if (!b) return;
          ta.value = (ta.value ? ta.value + "\n\n" : "") + b.textContent + "\n"; ta.focus(); haptic();
        });
        $("[data-save]", sh).addEventListener("click", () => {
          const text = ta.value.trim();
          if (!text) { gsap.fromTo(ta, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" }); return; }
          S().journal.push({ ts: Date.now(), text, mood });
          const rl = S().reset[Store.dayKey()] || (S().reset[Store.dayKey()] = []);
          if (!rl.includes("journal")) rl.push("journal");
          Store.save();
          close(); Sound.success(); toast("Opgeslagen in je dagboek ✍️"); refresh();
        });
      }
    });
  }

  function lessonSheet(id) {
    const l = DATA.lessons.find(x => x.id === id);
    const done = S().lessonsDone.includes(id);
    sheet(`
      <span class="pill">${l.cat} · ${l.min} min</span>
      <h2 style="font-size:28px;margin:12px 0 18px">${l.t}</h2>
      <div class="lesson-body">${l.body}</div>
      <div style="margin-top:28px"><button class="btn ${done ? "ghost" : ""}" data-done>${done ? "✓ Gelezen" : "Markeer als gelezen"}</button></div>`, {
      onMount(sh, close) {
        $("[data-done]", sh).addEventListener("click", () => {
          if (!done) { S().lessonsDone.push(id); Store.save(); Sound.success(); confetti(40); toast("Les voltooid 📚"); }
          close(); refresh(false);
        });
      }
    });
  }

  function blockerSheet() {
    sheet(`
      <h2>Blocker instellen</h2>
      <p class="sub">iOS heeft een ingebouwde contentfilter. Zo zet je hem aan (2 minuten):</p>
      <div class="card flush">
        ${[
          ["⚙️", "Open Instellingen", "Ga naar Schermtijd"],
          ["🔒", "Inhoud en privacy", "Zet Beperkingen voor inhoud en privacy aan"],
          ["🌐", "Webcontent", "Beperkingen voor inhoud → Webcontent"],
          ["🚫", "Beperk volwassenen-sites", "Kies 'Beperk websites voor volwassenen'. Voeg eventueel extra sites toe onder 'Nooit toestaan'"],
          ["🔑", "Schermtijd-code", "Laat een vriend of partner de code instellen, zodat je hem niet zelf kunt uitzetten"]
        ].map(([e, t, s], i) => `<div class="list-item"><span class="li-ico">${e}</span><span class="li-body"><div class="li-title">${i + 1}. ${t}</div><div class="li-sub">${s}</div></span></div>`).join("")}
      </div>
      <label class="lbl">Extra tips</label>
      <div class="card">
        <p class="small" style="line-height:1.6">• Stel <b>App-limieten</b> in voor social media die je triggert<br>• Gebruik <b>Downtime</b> vanaf 23:00<br>• Verwijder browsers behalve Safari<br>• Zet je DNS op een familiefilter via een configuratieprofiel</p>
      </div>
      <div style="margin-top:22px"><button class="btn" data-open>Open Instellingen</button></div>`, {
      onMount(sh) {
        $("[data-open]", sh).addEventListener("click", () => { location.href = "App-prefs:SCREEN_TIME"; setTimeout(() => toast("Open handmatig: Instellingen → Schermtijd"), 800); });
      }
    });
  }

  function reasonsSheet() {
    let sel = S().reasons.slice();
    const custom = sel.filter(r => !DATA.reasons.includes(r));
    sheet(`
      <h2>Waarom ik dit doe</h2>
      <p class="sub">Deze redenen zie je terug wanneer het moeilijk wordt.</p>
      ${chipsHtml(DATA.reasons.concat(custom), sel, "rs")}
      <label class="lbl">Eigen reden</label>
      <div class="row"><input class="field" data-new placeholder="Bijv. voor mijn kinderen"><button class="btn sm" data-add>+</button></div>
      <label class="lbl">Mijn belofte</label>
      <textarea class="field" data-pledge placeholder="Ik beloof mezelf...">${esc(S().pledge)}</textarea>
      <div style="margin-top:22px"><button class="btn" data-save>Opslaan</button></div>`, {
      onMount(sh, close) {
        bindChips(sh, "rs", true, v => sel = v);
        $("[data-add]", sh).addEventListener("click", () => {
          const v = $("[data-new]", sh).value.trim(); if (!v) return;
          const b = document.createElement("button"); b.className = "chip on"; b.dataset.v = v; b.textContent = v;
          $('[data-chips="rs"]', sh).appendChild(b); sel.push(v); $("[data-new]", sh).value = "";
          gsap.from(b, { scale: 0, duration: 0.4, ease: "back.out(3)" });
        });
        $("[data-save]", sh).addEventListener("click", () => {
          Store.set({ reasons: sel, pledge: $("[data-pledge]", sh).value.trim() });
          close(); toast("Opgeslagen"); refresh(false);
        });
      }
    });
  }

  function startSheet() {
    const d = new Date(S().startDate);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    sheet(`
      <h2>Startmoment aanpassen</h2>
      <p class="sub">Wanneer begon je huidige streak?</p>
      <input class="field" type="datetime-local" data-dt value="${local}" max="${new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}">
      <div style="margin-top:22px"><button class="btn" data-save>Opslaan</button></div>`, {
      onMount(sh, close) {
        $("[data-save]", sh).addEventListener("click", () => {
          const v = new Date($("[data-dt]", sh).value).getTime();
          if (!v || v > Date.now()) return toast("Kies een moment in het verleden");
          const patch = { startDate: v };
          if (v < (S().firstStart || Infinity)) patch.firstStart = v;
          Store.set(patch); close(); toast("Streak bijgewerkt"); refresh(false);
        });
      }
    });
  }

  async function exportData() {
    const json = Store.export();
    const file = new File([json], `rewired-backup-${Store.dayKey()}.json`, { type: "application/json" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Rewired back-up" }); return; }
    } catch (e) { if (e.name === "AbortError") return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file); a.download = file.name; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }

  async function shareProgress() {
    const d = Store.streakDays();
    const text = `Ik ben ${d} ${d === 1 ? "dag" : "dagen"} vrij en mijn brein is ${Store.rewirePct().toFixed(0)}% herbedraad met Rewired. 🧠💪`;
    try { if (navigator.share) { await navigator.share({ text }); return; } } catch { return; }
    try { await navigator.clipboard.writeText(text); toast("Gekopieerd naar klembord"); } catch { toast(text); }
  }

  function wipe() {
    sheet(`
      <h2>Alles wissen?</h2>
      <p class="sub">Al je streaks, logs, dagboek en instellingen worden permanent verwijderd. Maak eventueel eerst een back-up.</p>
      <button class="btn danger" data-yes>Ja, wis alles</button>
      <div style="margin-top:10px"><button class="btn ghost" data-no>Annuleren</button></div>`, {
      onMount(sh, close) {
        $("[data-no]", sh).addEventListener("click", close);
        $("[data-yes]", sh).addEventListener("click", async () => { await Sync.logout(); Store.reset(); close(); setTimeout(() => location.reload(), 400); });
      }
    });
  }

  /* ====================================================== */
  /*                     MILESTONES                         */
  /* ====================================================== */

  function checkMilestone() {
    const s = S();
    s.celebrated = s.celebrated || [];
    const d = Store.streakDays();
    const m = DATA.milestones.filter(x => x.d <= d && !s.celebrated.includes(x.d + "@" + s.startDate)).pop();
    if (!m) return;
    DATA.milestones.filter(x => x.d <= d).forEach(x => {
      const key = x.d + "@" + s.startDate;
      if (!s.celebrated.includes(key)) s.celebrated.push(key);
    });
    Store.save();
    fullscreen(`
      <div class="fs-center">
        <div class="eyebrow">Mijlpaal bereikt</div>
        <div data-b style="width:150px;height:150px;border-radius:50%;display:grid;place-items:center;font-size:72px;margin:18px 0;background:radial-gradient(circle,rgba(124,92,255,.6),rgba(124,92,255,.05));box-shadow:0 0 80px rgba(124,92,255,.6)">${m.e}</div>
        <h2 style="font-size:40px" data-t>${m.t}</h2>
        <p class="muted" style="font-size:18px;margin-top:8px" data-t>${m.s}</p>
      </div>
      <div class="fs-bottom"><button class="btn" data-close>Doorgaan</button></div>`, {
      bg: "radial-gradient(circle at 50% 40%, #241a5e, #05050a 70%)",
      onMount(el) {
        if (FX.calm()) gsap.from($("[data-b]", el), { opacity: 0, duration: 0.6, delay: 0.2 });
        else gsap.from($("[data-b]", el), { scale: 0, rotation: -180, duration: 1.2, ease: "elastic.out(1,0.5)", delay: 0.2 });
        gsap.from($$("[data-t]", el), { y: 30, opacity: 0, stagger: 0.15, duration: 0.7, delay: 0.6, ease: "power3.out" });
        setTimeout(() => { confetti(120); Sound.success(); haptic([20, 50, 20, 50, 40]); }, 500);
      }
    });
  }

  /* ====================================================== */
  /*                     ONBOARDING                         */
  /* ====================================================== */

  function onboarding() {
    const ans = { name: "", freq: "", triggers: [], reasons: [], last: "now", pledge: "", signature: "" };
    let step = 0;
    const el = document.createElement("div");
    el.className = "ob";
    el.innerHTML = `
      <div class="ob-progress"><i></i></div>
      <div class="ob-body" data-body></div>
      <div class="ob-foot"><button class="btn" data-next>Begin</button></div>`;
    document.body.appendChild(el);
    $("#panicBtn").classList.add("hidden");
    $("#tabbar").style.display = "none";
    const body = $("[data-body]", el), next = $("[data-next]", el), prog = $(".ob-progress i", el);

    const logo = `<svg class="big-logo" viewBox="0 0 120 120" data-logo>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>
      <circle cx="60" cy="60" r="54" fill="none" stroke="url(#lg)" stroke-width="3" opacity=".35"/>
      <path data-path d="M28 70c8-22 18-30 30-18s22 6 34-20" fill="none" stroke="url(#lg)" stroke-width="7" stroke-linecap="round"/>
      <circle cx="28" cy="70" r="6" fill="#22d3ee"/><circle cx="92" cy="32" r="6" fill="#7c5cff"/>
    </svg>`;

    const steps = [
      {
        html: () => `<div style="text-align:center;padding-top:30px">${logo}
          <h1>Herprogrammeer<br><span class="grad-text">je brein.</span></h1>
          <p class="lead">Gebaseerd op neurowetenschap. Streak tracking, lichttherapie, ademwerk en een dagelijkse dopamine reset. Alles 100% privé op je iPhone.</p>
          <button class="link" data-have-account style="margin-top:22px;color:var(--accent2);font-weight:600;font-size:15px">Ik heb al een account →</button></div>`,
        btn: "Begin mijn reis",
        mount: () => {
          $("[data-have-account]", body).addEventListener("click", () => {
            haptic(); Sound.tap();
            Sync.authSheet("login", null, { afterLogin: () => {
              if (!Store.s.onboarded) { toast("Nog geen gegevens in dit account, doorloop de intro"); return; }
              gsap.to(el, { opacity: 0, duration: 0.5, onComplete: () => { el.remove(); boot(); } });
            } });
          });
          const p = $("[data-path]", body), len = p.getTotalLength();
          gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", delay: 0.3 });
          gsap.from("[data-logo]", { scale: 0.6, rotation: -20, duration: 1.4, ease: "elastic.out(1,0.6)" });
        }
      },
      {
        html: () => `<h1>Hoe mogen we je noemen?</h1><p class="lead">Alleen voor jou. Niets verlaat dit apparaat.</p>
          <input class="field" data-name style="margin-top:28px;font-size:20px;padding:18px" placeholder="Je voornaam" value="${esc(ans.name)}" autocomplete="given-name">`,
        mount: () => { const i = $("[data-name]", body); i.addEventListener("input", () => ans.name = i.value.trim()); },
        valid: () => true
      },
      {
        html: () => `<h1>Hoe vaak worstel je hiermee?</h1><p class="lead">Zo stemmen we je plan af.</p><div style="margin-top:26px" data-opts>
          ${[["🔥", "Meerdere keren per dag"], ["📅", "Dagelijks"], ["🗓️", "Een paar keer per week"], ["🌙", "Wekelijks of minder"]].map(([e, t]) => `<button class="opt ${ans.freq === t ? "on" : ""}" data-v="${t}"><span class="emo">${e}</span>${t}</button>`).join("")}</div>`,
        mount: () => single("freq"),
        valid: () => !!ans.freq
      },
      {
        html: () => `<h1>Wat triggert je?</h1><p class="lead">Kies alles wat herkenbaar is.</p><div style="margin-top:26px">${chipsHtml(DATA.triggers.filter(t => t !== "Anders"), ans.triggers, "ot")}</div>`,
        mount: () => bindChips(body, "ot", true, v => ans.triggers = v),
        valid: () => true
      },
      {
        html: () => `<h1>Waarom wil je stoppen?</h1><p class="lead">Je ziet dit terug op de moeilijkste momenten.</p><div style="margin-top:26px">${chipsHtml(DATA.reasons, ans.reasons, "or")}</div>`,
        mount: () => bindChips(body, "or", true, v => ans.reasons = v),
        valid: () => ans.reasons.length > 0
      },
      {
        html: () => `<h1>Wanneer was de laatste keer?</h1><p class="lead">Je streak begint vanaf dit moment.</p><div style="margin-top:26px" data-opts>
          ${[["now", "⏱️", "Vandaag / net"], ["1", "1️⃣", "Gisteren"], ["3", "3️⃣", "3 dagen geleden"], ["7", "7️⃣", "Een week geleden"]].map(([v, e, t]) => `<button class="opt ${ans.last === v ? "on" : ""}" data-v="${v}"><span class="emo">${e}</span>${t}</button>`).join("")}</div>`,
        mount: () => single("last"),
        valid: () => true
      },
      {
        html: () => `<h1>Teken je belofte</h1><p class="lead">Een commitment aan jezelf. Schrijf het op en zet je handtekening.</p>
          <textarea class="field" data-pledge style="margin-top:22px;min-height:90px" placeholder="Ik beloof mezelf om...">${esc(ans.pledge || "Ik beloof mezelf om de controle terug te nemen, dag voor dag.")}</textarea>
          <canvas class="sig-pad" data-sig style="margin-top:12px"></canvas>
          <div class="row between small muted" style="margin-top:8px"><span>✍️ Teken hierboven</span><button class="link" data-clear style="color:var(--accent2)">Wissen</button></div>`,
        mount: () => { signature(); const t = $("[data-pledge]", body); ans.pledge = t.value; t.addEventListener("input", () => ans.pledge = t.value.trim()); },
        valid: () => true
      },
      {
        html: () => {
          const target = new Date(Date.now() + DATA.REWIRE_DAYS * DAY - (ans.last === "now" ? 0 : +ans.last * DAY));
          return `<div style="text-align:center;padding-top:10px">
            <div class="eyebrow">Jouw plan is klaar${ans.name ? ", " + esc(ans.name) : ""}</div>
            <h1 style="margin-top:6px">Je brein is herbedraad op</h1>
            <div class="grad-text" style="font-family:var(--display);font-size:38px;font-weight:700;margin-top:10px" data-date>${target.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" })}</div>
            <div style="margin:28px auto 0;max-width:320px;text-align:left" data-plan>
              ${[["🔥", "Dagelijkse streak & brein-meter"], ["💡", "Lichttherapie bij hoge drang"], ["🌬️", "Ademwerk & meditatie"], ["⚡", "Dopamine Reset routine"], ["🚨", "Noodmodus met 1 tik"]].map(([e, t]) => `<div class="row" style="padding:10px 0"><span style="font-size:22px">${e}</span><span style="font-weight:500">${t}</span></div>`).join("")}
            </div></div>`;
        },
        btn: "Start Rewired",
        mount: () => {
          gsap.from("[data-date]", { scale: 0.5, opacity: 0, duration: 1, ease: "elastic.out(1,0.6)", delay: 0.3 });
          gsap.from("[data-plan] .row", { x: -30, opacity: 0, stagger: 0.1, delay: 0.6, duration: 0.6, ease: "power3.out" });
        }
      }
    ];

    function single(key) {
      const box = $("[data-opts]", body);
      box.addEventListener("click", e => {
        const b = e.target.closest(".opt"); if (!b) return;
        $$(".opt", box).forEach(x => x.classList.toggle("on", x === b));
        ans[key] = b.dataset.v; haptic(); Sound.tap();
        gsap.fromTo(b, { scale: 0.96 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
      });
    }

    function signature() {
      const c = $("[data-sig]", body), ctx = c.getContext("2d");
      const dpr = devicePixelRatio || 1;
      const r = c.getBoundingClientRect();
      c.width = r.width * dpr; c.height = r.height * dpr; ctx.scale(dpr, dpr);
      ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#fff";
      let drawing = false, drawn = false;
      const pos = e => { const t = e.touches ? e.touches[0] : e; const b = c.getBoundingClientRect(); return [t.clientX - b.left, t.clientY - b.top]; };
      const down = e => { e.preventDefault(); drawing = true; ctx.beginPath(); ctx.moveTo(...pos(e)); };
      const move = e => { if (!drawing) return; e.preventDefault(); ctx.lineTo(...pos(e)); ctx.stroke(); drawn = true; };
      const up = () => { if (drawing && drawn) ans.signature = c.toDataURL("image/png"); drawing = false; };
      c.addEventListener("touchstart", down, { passive: false }); c.addEventListener("touchmove", move, { passive: false }); c.addEventListener("touchend", up);
      c.addEventListener("mousedown", down); c.addEventListener("mousemove", move); window.addEventListener("mouseup", up);
      $("[data-clear]", body).addEventListener("click", () => { ctx.clearRect(0, 0, c.width, c.height); ans.signature = ""; drawn = false; });
    }

    function show(dir = 1) {
      const st = steps[step];
      gsap.to(prog, { width: ((step + 1) / steps.length) * 100 + "%", duration: 0.6, ease: "power3.out" });
      next.textContent = st.btn || "Verder";
      gsap.to(body, {
        opacity: 0, x: -40 * dir, duration: step === 0 && dir === 1 && !body.innerHTML ? 0 : 0.25, ease: "power2.in", onComplete: () => {
          body.innerHTML = st.html();
          gsap.fromTo(body, { opacity: 0, x: 40 * dir }, { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" });
          gsap.from($$("h1,.lead,.opt,.chip,.field,.sig-pad", body), { y: 24, opacity: 0, stagger: 0.04, duration: 0.55, ease: "power3.out", delay: 0.05 });
          if (st.mount) st.mount();
        }
      });
    }

    next.addEventListener("click", () => {
      const st = steps[step];
      if (st.valid && !st.valid()) {
        gsap.fromTo(body, { x: -10 }, { x: 0, duration: 0.6, ease: "elastic.out(1,0.3)" }); haptic([10, 30, 10]);
        toast("Maak eerst een keuze"); return;
      }
      haptic(); Sound.tap();
      if (step < steps.length - 1) { step++; show(1); return; }
      // finish
      const start = ans.last === "now" ? Date.now() : Date.now() - +ans.last * DAY;
      Store.set({ onboarded: true, name: ans.name, freq: ans.freq, triggers: ans.triggers, reasons: ans.reasons, pledge: ans.pledge, signature: ans.signature, startDate: start, firstStart: start });
      Sound.success(); confetti(100);
      gsap.to(el, { opacity: 0, scale: 1.05, duration: 0.6, delay: 0.3, ease: "power2.in", onComplete: () => { el.remove(); boot(); } });
    });

    show();
  }

  /* ====================================================== */
  /*                       EVENTS                           */
  /* ====================================================== */

  const ACTIONS = {
    checkin: checkinSheet, urge: urgeSheet, relapse: () => relapseSheet(), journal: journalSheet, habits: () => Habits.manageSheet(), addHabit: () => Habits.addSheet(),
    light: Tools.openLight, breath: Tools.breathPicker, meditate: () => Tools.meditationPicker(), surf: () => Tools.meditationPicker("surf"),
    panic: Tools.panic, blocker: blockerSheet, share: shareProgress, export: exportData, wipe, editReasons: reasonsSheet, editStart: startSheet, recap: () => Recap.show(), rewards: () => Rewards.manage(), apps: () => AppTrack.overview(),
    pushSetup: () => Push.enable().then(() => { Sound.success(); toast("Meldingen staan aan 🔔"); render(false); })
      .catch(e => toast(e.message === "denied" ? "Toestemming geweigerd" : e.message === "config" ? "Server nog niet ingesteld" : "Aanzetten mislukt")),
    pushDismiss: () => { Push.prefs().dismissed = true; Store.save(); render(false); }
  };

  function bindEvents() {
    $("#tabbar").addEventListener("click", e => { const t = e.target.closest(".tab"); if (t) switchTab(t.dataset.tab); });
    $("#panicBtn").addEventListener("click", () => {
      gsap.fromTo("#panicBtn", { scale: 0.85 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
      Tools.panic();
    });

    const v = $("#view");
    v.addEventListener("click", e => {
      const a = e.target.closest("[data-action]");
      if (a) { haptic(); Sound.tap(); ACTIONS[a.dataset.action] && ACTIONS[a.dataset.action](); return; }

      const r = e.target.closest("[data-toggle-reset]");
      if (r) {
        const on = Store.toggleIn("reset", r.dataset.toggleReset);
        r.classList.toggle("done", on); haptic(on ? [10, 20, 10] : 8); Sound.toggle(on);
        gsap.fromTo(r.querySelector(".check"), { scale: 0.6 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
        const n = Store.resetDoneToday(), total = DATA.resetTasks.length;
        $("[data-reset-count]").textContent = n + "/" + total;
        gsap.to("[data-reset-bar]", { width: (n / total) * 100 + "%", duration: 0.6, ease: "power3.out" });
        if (on && n === total) { confetti(120); Sound.success(); toast("Dopamine Reset voltooid! ⚡"); }
        return;
      }
      if (tab === "learn" && Learn.handleClick(e, v)) return;
      if (Habits.handleClick(e, v)) return;
      const rv = e.target.closest("[data-recovery]");
      if (rv) {
        haptic(); Sound.tap();
        const go = { journal: journalSheet, checkin: checkinSheet, breath: Tools.breathPicker, surf: () => Tools.meditationPicker("surf"),
          reset: () => { const r = $("[data-reset-count]"); if (r) r.closest(".section-title").scrollIntoView({ behavior: "smooth" }); } }[rv.dataset.recovery];
        if (go) go();
        return;
      }
      const oh = e.target.closest("[data-open-habit]");
      if (oh) { haptic(); Sound.tap(); Habits.openHabit(oh.dataset.openHabit); return; }
      const l = e.target.closest("[data-lesson]");
      if (l) { haptic(); Sound.tap(); lessonSheet(l.dataset.lesson); return; }

      const st = e.target.closest("[data-setting]");
      if (st) {
        const k = st.dataset.setting; S().settings[k] = !S().settings[k]; Store.save();
        if (S().settings[k]) { haptic(); Sound.tap(); }
        if (k === "calm") FX.ambientBg();
        render(false);
      }
    });

    v.addEventListener("change", e => {
      if (e.target.matches("[data-name]")) { Store.set({ name: e.target.value.trim() }); toast("Naam opgeslagen"); render(false); }
      if (e.target.matches("[data-import]")) {
        const f = e.target.files[0]; if (!f) return;
        f.text().then(t => { Store.import(t); toast("Back-up hersteld"); setTimeout(() => location.reload(), 800); })
          .catch(() => toast("Ongeldig bestand"));
      }
    });

    // re-sync on return from background
    document.addEventListener("visibilitychange", () => {
      Sync.sync();
      if (document.hidden) return;
      if (navigator.clearAppBadge) navigator.clearAppBadge().catch(() => {});
      if (Store.dayKey() !== lastKey) newDay();
      else if (tab === "home") render(false);
      setTimeout(() => Recap.maybeAuto(), 900);
      AppTrack.pull().then(ch => { if (ch && !$("#sheet-root").children.length) render(false); });
    });
    window.addEventListener("resize", () => moveIndicator(true));
  }

  function refresh(animate = false) { render(animate); }

  let booted = false;
  function boot() {
    $("#tabbar").style.display = "";
    $("#panicBtn").classList.remove("hidden");
    if (!booted) { bindEvents(); booted = true; }
    render(true);
    moveIndicator(true);
    gsap.from("#tabbar", { y: 120, duration: 0.9, ease: "expo.out", delay: 0.2 });
    gsap.from("#panicBtn", { scale: 0, rotation: -90, duration: 0.9, ease: "back.out(2)", delay: 0.5 });
    FX.ambientBg();
    startTicker();
    setTimeout(checkMilestone, 1200);
    setTimeout(() => Recap.maybeAuto(), 2400);
    AppTrack.pull(true).then(ch => { if (ch) render(false); });
    Push.ensure();
    Sync.sync();
    const open = new URLSearchParams(location.search).get("open");
    if (open) { history.replaceState(null, "", location.pathname); setTimeout(() => openFromNotification(open), 900); }
  }

  /* Open a screen requested by a notification tap (?open=… or a message from the service worker) */
  function openFromNotification(what) {
    if (!what || !Store.s.onboarded) return;
    if ($("#fs-root").children.length) return;
    if (tab !== "home") switchTab("home");
    const run = { checkin: checkinSheet, panic: Tools.panic, urge: urgeSheet, breath: Tools.breathPicker, recap: () => { S().recapSeen = null; Recap.show(); } }[what];
    if (run) setTimeout(run, 500);
  }
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.addEventListener("message", e => {
      if (!e.data) return;
      if (e.data.type === "open") openFromNotification(e.data.open);
      if (e.data.type === "push" && !document.hidden) { toast("🔔 " + e.data.title + (e.data.body ? " · " + e.data.body : "")); haptic([20, 40, 20]); }
    });
  }

  window.App = { refresh, relapseSheet };

  /* ---------- init ---------- */
  FX.ambientBg();
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  if (Store.s.onboarded) boot(); else onboarding();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
