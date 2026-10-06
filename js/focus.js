/* What you are working on: porn, gambling and/or ADHD (state.focus = ["porn", "gambling", "adhd"]).
   Everything here only appears for a chosen focus, so the app stays calm for everyone else:
   - extra triggers in the urge log and onboarding
   - lessons + a learning path per focus (js/lessons3.js, filtered in Learn)
   - a short starter plan on Home (max 2 open steps, disappears when done or dismissed)
   - gambling: money not gambled, counted from your streak start
   - ADHD: dopamine menu (Tools), short routines by default, habit warning from 2
   - help contacts per focus (Profiel → Hulp) */
(function () {
  const { $, $$, esc, haptic, toast, sheet } = FX;
  const DAY = Store.DAY;
  const S = () => Store.s;

  const TOPICS = {
    porn: { e: "🛡️", t: "Porno", s: "Kijken, scrollen, 's avonds in bed" },
    gambling: { e: "💶", t: "Gokken", s: "Casino, sportweddenschappen, krasloten" },
    adhd: { e: "⚡", t: "ADHD", s: "Impulsief, prikkels zoeken, moeite met structuur" }
  };
  const list = () => (S().focus || []).filter(f => TOPICS[f]);
  const has = f => list().includes(f);

  const EXTRA_TRIGGERS = {
    porn: ["Telefoon in bed", "Uitdagende content"],
    gambling: ["Salaris binnen", "Sportwedstrijd", "Verlies terugwinnen", "Gokreclame"],
    adhd: ["Onrust", "Uitstellen"]
  };
  /* base triggers + the ones for your focus, "Anders" stays last */
  function triggers(focus = list()) {
    const base = DATA.triggers.filter(t => t !== "Anders");
    const extra = focus.flatMap(f => EXTRA_TRIGGERS[f] || []);
    return [...new Set([...extra, ...base])].concat("Anders");
  }
  const TRIGGER_TIPS = {
    "Salaris binnen": "Zet vaste lasten en sparen automatisch weg op de dag dat je salaris binnenkomt.",
    "Sportwedstrijd": "Kijk de volgende wedstrijd samen met iemand, of met je telefoon in een andere kamer.",
    "Verlies terugwinnen": "Verlies terugwinnen maakt verlies groter. Stop, en doe 10 minuten iets anders.",
    "Gokreclame": "Zet gerichte advertenties uit en ontvolg accounts van aanbieders.",
    "Telefoon in bed": "Leg je telefoon vanavond aan de lader buiten de slaapkamer.",
    "Uitdagende content": "Ontvolg accounts die je triggeren en zet de Blocker aan.",
    "Onrust": "Kies iets snels van je dopamine-menu: beweging of koud water werkt vaak direct.",
    "Uitstellen": "Zet een timer op 5 minuten en begin alleen met de eerste stap."
  };

  /* ---------- help ---------- */
  const HELP = {
    all: [
      { e: "🩺", t: "Je huisarts", s: "Eerste stap voor hulp en doorverwijzing" },
      { e: "☎️", t: "113 Zelfmoordpreventie", s: "Bij crisis: 113 of gratis 0800-0113, 24/7", href: "https://www.113.nl" }
    ],
    porn: [{ e: "🛡️", t: "Jellinek", s: "Anonieme zelfhulp en online behandeling, ook voor porno", href: "https://www.jellinek.nl" }],
    gambling: [
      { e: "💬", t: "OpenOverGokken", s: "Gratis en anoniem: 0800-2400022 (24/7), chat en WhatsApp", href: "https://openovergokken.nl/hulplijnen/" },
      { e: "🔒", t: "Gokstop via Cruks", s: "Sluit jezelf met DigiD uit bij alle legale aanbieders", href: "https://cruksregister.nl" }
    ],
    adhd: [{ e: "⚡", t: "ADHD-onderzoek", s: "Via je huisarts naar een psycholoog of psychiater (zie de les 'Diagnose en behandeling')" }]
  };
  function helpSheet() {
    const items = [...list().flatMap(f => HELP[f]), ...HELP.all];
    sheet(`
      <h2>Hulp & contact</h2>
      <p class="sub">Je hoeft het niet alleen te doen. Deze hulp is gratis of via je zorgverzekering, en vaak anoniem.</p>
      <div class="card flush">${items.map(h => `${h.href ? `<a class="list-item" href="${h.href}" target="_blank" rel="noopener">` : `<div class="list-item">`}
        <span class="li-ico">${h.e}</span><span class="li-body"><div class="li-title">${esc(h.t)}</div><div class="li-sub">${esc(h.s)}</div></span>${h.href ? `<span class="muted">↗</span></a>` : "</div>"}`).join("")}</div>`);
  }

  /* ---------- starter plan (Home shows only the next 2 open steps, to keep it calm) ---------- */
  const PLAN = {
    porn: [
      { id: "blocker", t: "Zet de Blocker aan", s: "Schermtijd-filter, iemand anders kiest de code", action: "blocker" },
      { id: "bedphone", t: "Telefoon 's nachts buiten de slaapkamer", s: "Zit ook in je avondroutine" }
    ],
    gambling: [
      { id: "cruks", t: "Neem een gokstop via Cruks", s: "cruksregister.nl · met DigiD · minimaal 6 maanden", href: "https://cruksregister.nl" },
      { id: "apps", t: "Gok-apps en accounts weg", s: "Verwijderen en accounts sluiten" },
      { id: "bank", t: "Limiet op je pas", s: "Vraag je bank ook naar een blokkade voor goktransacties" },
      { id: "money", t: "Zet je geldteller aan", s: "Hoeveel vergokte je gemiddeld per week?", action: "money" }
    ],
    adhd: [
      { id: "menu", t: "Maak je dopamine-menu", s: "Snelle, gezonde prikkels voor als de drang komt", action: "menu" },
      { id: "short", t: "Korte routines", s: "Ochtend en avond in de korte versie: minder is vaker", action: "short" },
      { id: "gp", t: "Plan een gesprek met je huisarts", s: "Als je nog geen diagnose of behandeling hebt" }
    ]
  };
  const plan = () => S().focusPlan || (S().focusPlan = { done: [], dismissed: false });
  const planSteps = () => list().flatMap(f => PLAN[f].map(p => Object.assign({ f }, p)));
  const isDone = p => plan().done.includes(p.id) || (p.id === "money" && moneyPerWeek() > 0);

  function planCardHtml() {
    const all = planSteps(), open = all.filter(p => !isDone(p));
    if (!all.length || !open.length || plan().dismissed) return "";
    return `<div class="card fp-card" data-anim>
      <div class="row between"><div class="eyebrow">Je startplan · ${all.length - open.length}/${all.length}</div><button class="small muted" data-fp-hide aria-label="Verbergen" style="padding:4px">✕</button></div>
      ${open.slice(0, 2).map(p => `<div class="fp-step">
        <button class="check" data-fp-done="${p.id}" aria-label="Gedaan">${FX.checkIcon}</button>
        <${p.action || p.href ? `button data-fp-go="${p.id}"` : "span"} class="fp-body"><div class="li-title" style="font-size:15px">${esc(p.t)}</div><div class="li-sub">${esc(p.s)}</div></${p.action || p.href ? "button" : "span"}>
        ${p.action || p.href ? `<span class="muted">›</span>` : ""}</div>`).join("")}
      ${open.length > 2 ? `<div class="small muted" style="margin-top:4px">en nog ${open.length - 2} daarna</div>` : ""}
    </div>`;
  }
  function planClick(e) {
    const hide = e.target.closest("[data-fp-hide]");
    if (hide) { plan().dismissed = true; Store.save(); haptic(); if (window.App) App.refresh(false); toast("Startplan verborgen · terug via Profiel"); return true; }
    const d = e.target.closest("[data-fp-done]");
    if (d) {
      plan().done.push(d.dataset.fpDone); Store.save(); haptic([10, 20, 10]); Sound.toggle(true);
      const row = d.closest(".fp-step");
      gsap.to(row, { opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, duration: 0.35, ease: "power2.in", onComplete: () => window.App && App.refresh(false) });
      return true;
    }
    const g = e.target.closest("[data-fp-go]");
    if (g) {
      const p = planSteps().find(x => x.id === g.dataset.fpGo); haptic(); Sound.tap();
      if (p.href) { window.open(p.href, "_blank", "noopener"); return true; }
      if (p.action === "blocker" && window.App) App.action("blocker");
      if (p.action === "money") focusSheet(true);
      if (p.action === "menu") menuSheet();
      if (p.action === "short") {
        ["morning", "evening"].forEach(w => { const L = (((S().routineLog || {})[Store.dayKey()] || {})[w]); if (L) L.short = true; });
        S().routineShort = true; plan().done.push("short"); Store.save();
        toast("Routines starten voortaan in de korte versie"); if (window.App) App.refresh(false);
      }
      return true;
    }
    return false;
  }

  /* ---------- gambling: money not gambled ---------- */
  const moneyPerWeek = () => +(S().focusMoney || 0);
  function moneySaved() {
    if (!has("gambling") || !moneyPerWeek()) return 0;
    return Math.floor(moneyPerWeek() * (Date.now() - S().startDate) / (7 * DAY));
  }
  const euro = n => "€ " + new Intl.NumberFormat("nl-NL").format(n);
  function moneyHtml() {
    const n = moneySaved();
    return has("gambling") && moneyPerWeek() ? `<div class="fp-money">💶 <b>${euro(n)}</b> niet vergokt sinds je start</div>` : "";
  }

  /* ---------- ADHD: dopamine menu ---------- */
  const MENU_GROUPS = [["quick", "⚡ Snel (2–5 min)"], ["main", "🍽️ Hoofdgerecht (20+ min)"], ["side", "🎧 Erbij"], ["dessert", "🍰 Toetje, bewust en met timer"]];
  const DEFAULT_MENU = [
    ["quick", "Koud water over je gezicht"], ["quick", "20 squats of push-ups"], ["quick", "Eén nummer hard meezingen"], ["quick", "Even naar buiten lopen"],
    ["main", "Sporten of hardlopen"], ["main", "Wandelen met muziek of podcast"], ["main", "Iets maken: koken, tekenen, klussen"],
    ["side", "Muziek bij een saaie klus"], ["side", "Samen werken met iemand (videobellen mag)"],
    ["dessert", "Een aflevering kijken, niet in bed"], ["dessert", "Gamen met een timer van 30 min"]
  ];
  const menu = () => S().dopaMenu || (S().dopaMenu = DEFAULT_MENU.map(([k, t], i) => ({ id: "d" + i, k, t })));

  function menuSheet(pick) {
    const draw = () => MENU_GROUPS.map(([k, label]) => {
      const items = menu().filter(x => x.k === k);
      return `<label class="lbl">${label}</label><div class="card flush">${items.map(x => `<div class="list-item"><span class="li-body"><div class="li-title" style="font-size:15px">${esc(x.t)}</div></span><button class="small muted" data-del="${x.id}" aria-label="Verwijderen" style="padding:6px">✕</button></div>`).join("") || `<div class="empty" style="padding:14px">Nog niets</div>`}</div>`;
    }).join("");
    sheet(`
      <h2>⚡ Dopamine-menu</h2>
      <p class="sub">Als de drang of de verveling komt: kies van dit lijstje in plaats van te bedenken wat je moet doen.</p>
      <button class="btn" data-pick>🎲 Kies iets snels voor me</button>
      <div data-picked></div>
      <div data-menu>${draw()}</div>
      <label class="lbl">Toevoegen</label>
      <div class="seg" data-k>${MENU_GROUPS.map(([k, l], i) => `<button data-v="${k}" class="${i === 0 ? "on" : ""}">${l.split(" ")[0]}</button>`).join("")}</div>
      <div class="row" style="margin-top:10px"><input class="field" data-t maxlength="60" placeholder="bijv. Rondje fietsen"><button class="btn sm" data-add>Voeg toe</button></div>`, {
      onMount(sh) {
        let k = "quick";
        const redraw = () => { $("[data-menu]", sh).innerHTML = draw(); };
        const doPick = () => {
          const q = menu().filter(x => x.k === "quick"), pool = q.length ? q : menu();
          if (!pool.length) return;
          const x = pool[Math.floor(Math.random() * pool.length)];
          $("[data-picked]", sh).innerHTML = `<div class="card fp-pick">${esc(x.t)}<div class="small muted" style="margin-top:4px">Doe het nu, de drang zakt terwijl je bezig bent.</div></div>`;
          if (!FX.calm()) gsap.from($(".fp-pick", sh), { scale: 0.9, opacity: 0, duration: 0.4, ease: "back.out(2)" });
          haptic([10, 20, 10]); Sound.tap();
        };
        sh.addEventListener("click", e => {
          if (e.target.closest("[data-pick]")) { doPick(); return; }
          const del = e.target.closest("[data-del]");
          if (del) { S().dopaMenu = menu().filter(x => x.id !== del.dataset.del); Store.save(); haptic(); redraw(); return; }
          const kb = e.target.closest("[data-k] [data-v]");
          if (kb) { k = kb.dataset.v; $$("[data-k] button", sh).forEach(x => x.classList.toggle("on", x === kb)); haptic(); return; }
          if (e.target.closest("[data-add]")) {
            const t = $("[data-t]", sh).value.trim(); if (!t) return;
            menu().push({ id: "d" + Date.now(), k, t }); Store.save(); $("[data-t]", sh).value = "";
            if (!plan().done.includes("menu")) plan().done.push("menu");
            Store.save(); haptic([10, 20, 10]); Sound.success(); redraw();
          }
        });
        if (pick) doPick();
      },
      onClose() { if (window.App) App.refresh(false); }
    });
  }

  /* ---------- choose your focus ---------- */
  function chooserHtml(sel, money) {
    return `<div class="fp-topics" data-topics>${Object.entries(TOPICS).map(([k, x]) => `<button class="opt ${sel.includes(k) ? "on" : ""}" data-v="${k}"><span class="emo">${x.e}</span><span style="text-align:left"><div>${x.t}</div><div class="small muted" style="font-weight:400">${x.s}</div></span></button>`).join("")}</div>
      <div data-money-wrap style="${sel.includes("gambling") ? "" : "display:none"}"><label class="lbl" style="margin-top:18px">Hoeveel vergokte je gemiddeld per week? (optioneel)</label>
      <div class="row"><span style="font-size:20px">€</span><input class="field" data-money type="number" inputmode="numeric" min="0" max="100000" value="${money || ""}" placeholder="bijv. 75"></div>
      <p class="small muted" style="margin-top:6px">Dan zie je op Home hoeveel je sinds je start níet hebt vergokt.</p></div>`;
  }
  function bindChooser(root, sel, onChange) {
    $("[data-topics]", root).addEventListener("click", e => {
      const b = e.target.closest("[data-v]"); if (!b) return;
      const k = b.dataset.v, i = sel.indexOf(k);
      if (i >= 0) sel.splice(i, 1); else sel.push(k);
      b.classList.toggle("on", i < 0); haptic(); Sound.tap();
      $("[data-money-wrap]", root).style.display = sel.includes("gambling") ? "" : "none";
      if (onChange) onChange(sel);
    });
  }
  function focusSheet(toMoney) {
    const sel = list().slice();
    sheet(`
      <h2>Waar werk je aan?</h2>
      <p class="sub">Routini past lessen, triggers, je startplan en hulp hierop aan. Alleen jij ziet dit.</p>
      ${chooserHtml(sel, moneyPerWeek())}
      <div style="margin-top:22px"><button class="btn" data-save>Opslaan</button></div>
      ${plan().dismissed ? `<div style="margin-top:10px"><button class="btn ghost" data-replan>Startplan weer tonen</button></div>` : ""}`, {
      onMount(sh, close) {
        bindChooser(sh, sel);
        if (toMoney) setTimeout(() => { const m = $("[data-money]", sh); if (m) { m.scrollIntoView({ block: "center" }); m.focus(); } }, 450);
        const rp = $("[data-replan]", sh);
        if (rp) rp.addEventListener("click", () => { plan().dismissed = false; Store.save(); toast("Startplan staat weer op Home"); rp.remove(); });
        $("[data-save]", sh).addEventListener("click", () => {
          S().focus = sel.slice();
          const m = $("[data-money]", sh);
          S().focusMoney = sel.includes("gambling") && m ? Math.max(0, Math.min(100000, Math.round(+m.value || 0))) : moneyPerWeek();
          Store.save(); Sound.success(); haptic([10, 20, 10]); close();
          toast(sel.length ? "Aangepast aan " + sel.map(f => TOPICS[f].t.toLowerCase()).join(", ") : "Opgeslagen");
          if (window.App) App.refresh(false);
        });
      }
    });
  }

  const label = () => list().map(f => TOPICS[f].e + " " + TOPICS[f].t).join(" · ") || "Nog niets gekozen";

  window.Focus = { TOPICS, list, has, triggers, TRIGGER_TIPS, helpSheet, planCardHtml, planClick, moneyHtml, moneySaved, menuSheet, focusSheet, chooserHtml, bindChooser, label };
})();
