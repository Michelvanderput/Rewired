/* Learn tab: lesson of the day, daily boost, learning paths, categories, search, bookmarks, reader with quiz */
(function () {
  const { $, $$, esc, haptic, toast, confetti, sheet } = FX;
  const DAY = Store.DAY;
  const S = () => Store.s;

  const ALL = [...(window.LESSONS_A || []), ...(window.LESSONS_B || [])];
  DATA.lessons = ALL; // other modules keep using DATA.lessons
  const BOOSTS = window.LEARN_BOOSTS || [];
  const PATHS = window.LEARN_PATHS || [];
  const CATS = ["Wetenschap", "Technieken", "Mindset", "Lichaam", "Relaties", "Omgeving", "Herstel", "Motivatie"];
  const CAT_E = { Wetenschap: "🧠", Technieken: "🛠️", Mindset: "🧭", Lichaam: "💪", Relaties: "🤝", Omgeving: "🏠", Herstel: "🩹", Motivatie: "🔥" };
  const byId = id => ALL.find(l => l.id === id);

  const done = () => S().lessonsDone || (S().lessonsDone = []);
  const saved = () => S().lessonSaved || (S().lessonSaved = []);
  const quiz = () => S().quiz || (S().quiz = {});
  const dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / DAY);

  let filter = "all", query = "", boostOffset = 0;

  function lessonOfDay() {
    const unread = ALL.filter(l => !done().includes(l.id));
    const pool = unread.length ? unread : ALL;
    return pool[dayNum() % pool.length];
  }
  const boost = () => BOOSTS[(dayNum() + boostOffset) % BOOSTS.length];

  function pathProgress(p) { const n = p.ids.filter(id => done().includes(id)).length; return { n, tot: p.ids.length }; }

  /* ---------- list ---------- */
  function filtered() {
    const q = query.trim().toLowerCase();
    return ALL.filter(l => {
      if (filter === "saved" && !saved().includes(l.id)) return false;
      if (filter === "todo" && done().includes(l.id)) return false;
      if (CATS.includes(filter) && l.cat !== filter) return false;
      if (q && !(l.t + " " + l.take + " " + l.body).toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function itemHtml(l) {
    const d = done().includes(l.id), sv = saved().includes(l.id), qz = quiz()[l.id];
    return `<button class="card tap ln-item ${d ? "read" : ""}" data-lesson="${l.id}">
      <span class="ln-cat">${CAT_E[l.cat] || "📘"}</span>
      <span style="flex:1;min-width:0"><div class="ln-t">${esc(l.t)}</div>
        <div class="row" style="gap:6px;margin-top:6px;flex-wrap:wrap"><span class="pill ${d ? "done" : ""}">${d ? "✓ Gelezen" : esc(l.cat)}</span><span class="small muted">${l.min} min</span>${qz === 1 ? '<span class="small" style="color:var(--ok)">· quiz ✓</span>' : ""}${sv ? '<span class="small">⭐</span>' : ""}</div></span>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--dim);flex-shrink:0"><path d="M9 6l6 6-6 6"/></svg>
    </button>`;
  }
  function listHtml() {
    const items = filtered();
    return items.length ? items.map(itemHtml).join("") : `<div class="empty">${filter === "saved" ? "Nog geen bewaarde lessen. Tik ⭐ in een les om hem te bewaren." : "Geen lessen gevonden."}</div>`;
  }

  /* ---------- view ---------- */
  function view() {
    const d = done().length, tot = ALL.length, lod = lessonOfDay();
    const correct = Object.values(quiz()).filter(v => v === 1).length;
    return `
      <header class="page-head" data-anim><div><div class="eyebrow">Kennis is kracht</div><h1>Leren</h1></div>
        <div class="ln-stat"><b>${d}</b><span>/${tot} gelezen</span></div></header>

      <div class="card ln-boost" data-anim>
        <div class="row between"><div class="eyebrow" style="color:rgba(255,255,255,.75)">💬 Boost van vandaag</div><button class="small" data-boost style="color:rgba(255,255,255,.8);padding:4px">Nog een ↻</button></div>
        <div class="quote" data-boost-text>${esc(boost())}</div>
      </div>

      <button class="card tap ln-today" data-lesson="${lod.id}" data-anim>
        <div class="eyebrow">📖 Les van de dag${done().includes(lod.id) ? " · herhaling" : ""}</div>
        <div class="ln-today-t">${esc(lod.t)}</div>
        <p class="small muted" style="margin-top:6px;line-height:1.5">${esc(lod.take)}</p>
        <div class="row between" style="margin-top:12px"><span class="pill">${CAT_E[lod.cat]} ${esc(lod.cat)} · ${lod.min} min</span><b style="color:var(--accent2)">Lees nu →</b></div>
      </button>

      <div class="section-title" data-anim><h3>Leerpaden</h3><span class="small muted">${correct} quizvragen goed</span></div>
      <div class="ln-paths" data-anim>${PATHS.map(p => {
        const pr = pathProgress(p), pct = pr.n / pr.tot;
        return `<button class="ln-path ${pr.n === pr.tot ? "complete" : ""}" data-path="${p.id}">
          <span class="ln-path-ring" style="--p:${pct}"><span>${p.e}</span></span>
          <b>${esc(p.t)}</b><small>${esc(p.s)}</small><small class="ln-path-n">${pr.n}/${pr.tot}${pr.n === pr.tot ? " ✓" : ""}</small></button>`;
      }).join("")}</div>

      <div class="section-title" data-anim><h3>Alle lessen</h3><span class="small muted">${tot}</span></div>
      <input class="field" data-ln-search placeholder="🔍 Zoek een onderwerp, bijv. slaap of stress" value="${esc(query)}" data-anim style="margin-bottom:10px">
      <div class="ln-filters" data-anim>${[["all", "Alles"], ["todo", "Nog lezen"], ["saved", "⭐ Bewaard"], ...CATS.map(c => [c, CAT_E[c] + " " + c])].map(([k, t]) => `<button class="chip ${filter === k ? "on" : ""}" data-ln-filter="${k}">${t}</button>`).join("")}</div>
      <div data-ln-list data-anim>${listHtml()}</div>`;
  }

  function after(root) {
    const inp = $("[data-ln-search]", root);
    if (inp) inp.addEventListener("input", () => { query = inp.value; $("[data-ln-list]", root).innerHTML = listHtml(); });
  }

  function handleClick(e, root) {
    const t = e.target;
    const f = t.closest("[data-ln-filter]");
    if (f) {
      filter = f.dataset.lnFilter; haptic(); Sound.tap();
      $$("[data-ln-filter]", root).forEach(x => x.classList.toggle("on", x === f));
      const list = $("[data-ln-list]", root); list.innerHTML = listHtml();
      gsap.fromTo(list.children, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, stagger: 0.025, ease: "power2.out", clearProps: "transform,opacity" });
      return true;
    }
    if (t.closest("[data-boost]")) {
      boostOffset++; haptic(); Sound.tap();
      const el = $("[data-boost-text]", root);
      gsap.to(el, { opacity: 0, y: -8, duration: 0.2, onComplete: () => { el.textContent = boost(); gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35 }); } });
      return true;
    }
    const p = t.closest("[data-path]");
    if (p) { haptic(); Sound.tap(); openPath(p.dataset.path); return true; }
    const l = t.closest("[data-lesson]");
    if (l) { haptic(); Sound.tap(); open(l.dataset.lesson); return true; }
    return false;
  }

  /* ---------- path sheet ---------- */
  function openPath(id) {
    const p = PATHS.find(x => x.id === id);
    const pr = pathProgress(p);
    sheet(`
      <div style="font-size:40px">${p.e}</div>
      <h2 style="margin-top:6px">${esc(p.t)}</h2>
      <p class="sub">${esc(p.s)} · ${pr.n}/${pr.tot} gelezen</p>
      <div class="bar" style="margin-bottom:16px"><i style="width:${pr.n / pr.tot * 100}%"></i></div>
      ${p.ids.map((lid, i) => { const l = byId(lid); const d = done().includes(lid); return `
        <button class="list-item ln-step ${d ? "done" : ""}" data-open="${lid}" style="width:100%;text-align:left">
          <span class="li-ico">${d ? "✓" : i + 1}</span><span class="li-body"><div class="li-title">${esc(l.t)}</div><div class="li-sub">${esc(l.cat)} · ${l.min} min</div></span></button>`; }).join("")}
      <div style="margin-top:16px"><button class="btn" data-next>${pr.n === pr.tot ? "Pad voltooid ✓" : pr.n ? "Verder waar je was" : "Begin het pad"}</button></div>`, {
      onMount(sh, close) {
        sh.addEventListener("click", e => {
          const o = e.target.closest("[data-open]");
          if (o) { close(); setTimeout(() => open(o.dataset.open, { path: id }), 320); }
        });
        $("[data-next]", sh).addEventListener("click", () => {
          const nxt = p.ids.find(x => !done().includes(x)) || p.ids[0];
          close(); setTimeout(() => open(nxt, { path: id }), 320);
        });
      }
    });
  }

  /* ---------- reader ---------- */
  function markRead(l) {
    if (done().includes(l.id)) return false;
    done().push(l.id);
    const k = Store.dayKey(), log = S().learnLog || (S().learnLog = {});
    log[k] = (log[k] || 0) + l.min;
    // 15 minutes of learning today ticks the Dopamine Reset "read" task
    const rl = S().reset[k] || (S().reset[k] = []);
    if (log[k] >= 15 && !rl.includes("read")) { rl.push("read"); toast("⚡ Dopamine Reset: Lezen of leren afgevinkt"); }
    if (window.Habits && Habits.addToTpl) Habits.addToTpl("learn", l.min);
    Store.save();
    return true;
  }

  function nextOf(l, pathId) {
    if (pathId) { const p = PATHS.find(x => x.id === pathId); const i = p.ids.indexOf(l.id); if (i >= 0 && i < p.ids.length - 1) return byId(p.ids[i + 1]); }
    const same = ALL.filter(x => x.cat === l.cat); const i = same.indexOf(l);
    return same.slice(i + 1).find(x => !done().includes(x.id)) || ALL.find(x => !done().includes(x.id) && x.id !== l.id) || null;
  }

  function open(id, { path } = {}) {
    const l = byId(id); if (!l) return;
    const qz = l.quiz, answered = quiz()[l.id];
    const nx = nextOf(l, path);
    sheet(`
      <div class="row between"><span class="pill">${CAT_E[l.cat]} ${esc(l.cat)} · ${l.min} min</span><button class="ln-save ${saved().includes(l.id) ? "on" : ""}" data-save aria-label="Bewaren">${saved().includes(l.id) ? "⭐" : "☆"}</button></div>
      <h2 style="font-size:28px;margin:12px 0 18px;line-height:1.15">${esc(l.t)}</h2>
      <div class="lesson-body">${l.body}</div>
      <div class="ln-box take"><div class="eyebrow">🔑 Kernpunt</div><div>${esc(l.take)}</div></div>
      <div class="ln-box act"><div class="eyebrow">🎯 Probeer vandaag</div><div>${esc(l.act)}</div></div>
      ${qz ? `<div class="ln-quiz" data-quiz><div class="eyebrow">🧩 Quiz</div><div class="ln-q">${esc(qz.q)}</div>
        ${qz.a.map((a, i) => `<button class="ln-opt" data-a="${i}">${esc(a)}</button>`).join("")}
        <div class="ln-why" data-why></div></div>` : ""}
      <div style="margin-top:22px"><button class="btn ${done().includes(l.id) ? "ghost" : ""}" data-done>${done().includes(l.id) ? "✓ Gelezen" : "Markeer als gelezen"}</button></div>
      ${nx ? `<div style="margin-top:10px"><button class="btn ghost" data-next>Volgende: ${esc(nx.t)} →</button></div>` : ""}`, {
      onClose() { if (window.App) App.refresh(false); },
      onMount(sh, close) {
        const qbox = $("[data-quiz]", sh);
        const showAnswer = (pick, animate) => {
          $$(".ln-opt", qbox).forEach((b, i) => { b.disabled = true; b.classList.toggle("right", i === qz.c); b.classList.toggle("wrong", i === pick && pick !== qz.c); });
          const why = $("[data-why]", qbox);
          why.innerHTML = `${pick === qz.c ? "✅ Goed!" : "❌ Net niet."} ${esc(qz.why)}`;
          if (animate) gsap.fromTo(why, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.4 });
        };
        if (qbox && answered != null) showAnswer(answered === 1 ? qz.c : -1, false);
        if (qbox) qbox.addEventListener("click", e => {
          const b = e.target.closest("[data-a]"); if (!b || b.disabled) return;
          const pick = +b.dataset.a, ok = pick === qz.c;
          quiz()[l.id] = ok ? 1 : 0;
          if (ok) { Sound.success(); haptic([10, 30, 10]); confetti(30); } else { haptic([30, 40, 30]); Sound.soft(); }
          gsap.fromTo(b, { scale: 0.95 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
          showAnswer(pick, true);
          if (markRead(l)) { const dn = $("[data-done]", sh); dn.textContent = "✓ Gelezen"; dn.classList.add("ghost"); }
          Store.save();
        });
        $("[data-save]", sh).addEventListener("click", e => {
          const b = e.currentTarget, list = saved(), i = list.indexOf(l.id);
          if (i >= 0) list.splice(i, 1); else list.push(l.id);
          Store.save(); haptic(); Sound.tap();
          b.textContent = i >= 0 ? "☆" : "⭐"; b.classList.toggle("on", i < 0);
          gsap.fromTo(b, { scale: 0.6, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.5, ease: "back.out(3)" });
          toast(i >= 0 ? "Uit bewaard gehaald" : "Les bewaard ⭐");
        });
        $("[data-done]", sh).addEventListener("click", () => {
          if (markRead(l)) { Sound.success(); confetti(40); toast("Les voltooid 📚"); }
          close();
        });
        const nb = $("[data-next]", sh);
        if (nb) nb.addEventListener("click", () => { markRead(l); close(); setTimeout(() => open(nx.id, { path }), 320); });
      }
    });
  }

  window.Learn = { view, after, handleClick, open, openPath, ALL, PATHS };
})();
