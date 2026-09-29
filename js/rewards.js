/* Locked rewards (unlock after X clean days) and the recovery day after a relapse */
(function () {
  const { $, $$, esc, haptic, toast, confetti, sheet, fullscreen } = FX;
  const DAY = Store.DAY;
  const S = () => Store.s;

  const PRESETS = [
    { e: "🎮", t: "Avondje gamen zonder schuldgevoel", days: 3 },
    { e: "🍕", t: "Favoriete eten bestellen", days: 7 },
    { e: "🎬", t: "Naar de film", days: 14 },
    { e: "💆", t: "Massage of sauna", days: 21 },
    { e: "👟", t: "Nieuwe sneakers", days: 30 },
    { e: "🎧", t: "Nieuwe koptelefoon", days: 60 },
    { e: "✈️", t: "Weekendje weg", days: 90 }
  ];

  const list = () => S().rewards || (S().rewards = []);
  const streak = () => Store.streakDays();
  const isUnlocked = r => streak() >= r.days;
  const isClaimed = r => r.claimedFor === S().startDate;

  /* ---------- rewards UI ---------- */
  function nextReward() {
    const open = list().filter(r => !isClaimed(r)).sort((a, b) => a.days - b.days);
    return open.find(isUnlocked) || open[0] || null;
  }

  function cardHtml() {
    const r = nextReward();
    if (!r) return "";
    const d = streak(), un = isUnlocked(r);
    return `<button class="card tap rw-card ${un ? "unlocked" : ""}" data-action="rewards" data-anim>
      <span class="rw-ico">${un ? esc(r.e) : "🔒"}</span>
      <span style="flex:1;text-align:left;min-width:0">
        <div style="font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${un ? "🎁 Vrijgespeeld: " : ""}${esc(r.t)}</div>
        <div class="small muted">${un ? "Tik om je beloning te claimen" : `Nog ${r.days - d} ${r.days - d === 1 ? "dag" : "dagen"} clean · ${d}/${r.days}`}</div>
        <div class="bar" style="height:6px;margin-top:8px"><i style="width:${Math.min(100, d / r.days * 100)}%;${un ? "background:linear-gradient(90deg,#fbbf24,#f472b6)" : ""}"></i></div>
      </span></button>`;
  }

  function manage() {
    const draw = () => {
      const d = streak();
      const items = list().slice().sort((a, b) => a.days - b.days);
      return items.map(r => {
        const un = isUnlocked(r), cl = isClaimed(r);
        return `<div class="card rw-item ${un ? "unlocked" : ""}" data-rid="${r.id}">
          <div class="row" style="gap:12px"><span class="rw-ico">${un ? esc(r.e) : "🔒"}</span>
            <div style="flex:1;min-width:0"><div style="font-weight:600">${esc(r.t)}</div>
              <div class="small muted">${cl ? "✓ Geclaimd deze streak" : un ? "Vrijgespeeld!" : `${d}/${r.days} dagen clean`}</div></div>
            ${un && !cl ? `<button class="btn sm" data-claim="${r.id}">Claim 🎉</button>` : `<button class="small muted" data-rdel="${r.id}" style="padding:6px">✕</button>`}</div>
          <div class="bar" style="height:6px;margin-top:10px"><i style="width:${Math.min(100, d / r.days * 100)}%"></i></div>
        </div>`;
      }).join("") || `<div class="empty">Nog geen beloningen. Kies er hieronder een.</div>`;
    };
    sheet(`
      <h2>Beloningen</h2>
      <p class="sub">Iets leuks dat pas vrijkomt als je lang genoeg clean bent. Bij een terugval gaan niet-geclaimde beloningen weer op slot.</p>
      <div data-list>${draw()}</div>
      <label class="lbl">Snel toevoegen</label>
      <div class="chips" data-presets>${PRESETS.map((p, i) => `<button class="chip" data-p="${i}">${p.e} ${esc(p.t)} · ${p.days}d</button>`).join("")}</div>
      <label class="lbl">Eigen beloning</label>
      <div class="row"><input class="field" data-e maxlength="4" style="width:64px;text-align:center" value="🎁"><input class="field" data-t placeholder="Bijv. nieuwe game"></div>
      <div class="row" style="margin-top:10px"><input class="field" data-d type="number" inputmode="numeric" placeholder="Na hoeveel dagen?" style="flex:1"><button class="btn sm" data-add>Toevoegen</button></div>`, {
      onClose() { if (window.App) App.refresh(false); },
      onMount(sh) {
        const L = $("[data-list]", sh);
        const add = (e, t, days) => {
          list().push({ id: "r" + Date.now() + Math.random().toString(36).slice(2, 5), e, t, days });
          Store.save(); L.innerHTML = draw(); haptic(); Sound.success();
        };
        $("[data-presets]", sh).addEventListener("click", e => {
          const b = e.target.closest("[data-p]"); if (!b) return;
          const p = PRESETS[+b.dataset.p]; add(p.e, p.t, p.days);
          gsap.fromTo(b, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "back.out(3)" });
        });
        $("[data-add]", sh).addEventListener("click", () => {
          const t = $("[data-t]", sh).value.trim(), d = parseInt($("[data-d]", sh).value, 10);
          if (!t || !(d > 0)) { toast("Vul een naam en aantal dagen in"); return; }
          add($("[data-e]", sh).value.trim() || "🎁", t, d);
          $("[data-t]", sh).value = ""; $("[data-d]", sh).value = "";
        });
        L.addEventListener("click", e => {
          const c = e.target.closest("[data-claim]");
          if (c) {
            const r = list().find(x => x.id === c.dataset.claim);
            r.claimedFor = S().startDate; r.claimedAt = Date.now(); Store.save();
            confetti(120); Sound.success(); haptic([20, 50, 20]); toast(`${r.e} Geniet ervan, je hebt het verdiend!`);
            L.innerHTML = draw(); return;
          }
          const d = e.target.closest("[data-rdel]");
          if (d) { S().rewards = list().filter(x => x.id !== d.dataset.rdel); Store.save(); L.innerHTML = draw(); }
        });
      }
    });
  }

  /* Celebrate a reward the first time it unlocks during a streak */
  function checkUnlock() {
    const s = S();
    s.rewardSeen = s.rewardSeen || [];
    const r = list().find(x => isUnlocked(x) && !isClaimed(x) && !s.rewardSeen.includes(x.id + "@" + s.startDate));
    if (!r || $("#fs-root").children.length) return false;
    s.rewardSeen.push(r.id + "@" + s.startDate); Store.save();
    fullscreen(`
      <div class="fs-center">
        <div class="eyebrow">Beloning vrijgespeeld</div>
        <div data-b class="rw-big">${esc(r.e)}</div>
        <h2 style="font-size:30px;max-width:320px" data-t>${esc(r.t)}</h2>
        <p class="muted" style="font-size:17px;margin-top:10px" data-t>${r.days} dagen clean. Dit heb je verdiend.</p>
      </div>
      <div class="fs-bottom"><button class="btn" data-claim>Claim 🎉</button><button class="btn ghost" data-close style="margin-top:10px">Later</button></div>`, {
      bg: "radial-gradient(circle at 50% 40%, #4a2a10, #05050a 70%)",
      onClose() { if (window.App) App.refresh(false); },
      onMount(el, close) {
        gsap.from($("[data-b]", el), { scale: 0, rotation: -25, duration: 1.1, ease: "elastic.out(1,0.5)", delay: 0.2 });
        gsap.from($$("[data-t]", el), { y: 24, opacity: 0, stagger: 0.12, duration: 0.6, delay: 0.5 });
        setTimeout(() => { confetti(100); Sound.success(); haptic([20, 50, 20]); }, 400);
        $("[data-claim]", el).addEventListener("click", () => { r.claimedFor = S().startDate; r.claimedAt = Date.now(); Store.save(); close(); toast("Geniet ervan! 🎉"); if (window.App) App.refresh(false); });
      }
    });
    return true;
  }

  /* ---------- recovery day ---------- */
  const dayStart = ts => { const d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  function recovery() {
    const s = S();
    const r = s.relapses[s.relapses.length - 1];
    if (!r) return null;
    const relDay = Store.dayKey(r.ts);
    const recStart = dayStart(r.ts) + DAY + 3 * 3600000; // DST-safe: pick a moment on the next day
    const recDay = Store.dayKey(recStart);
    const end = dayStart(recStart) + DAY + 3 * 3600000;
    if (Date.now() > dayStart(end)) return null; // recovery window is over
    const log = (s.sessionLog || []).filter(x => x.ts > r.ts);
    const reset = [...new Set([...(s.reset[relDay] || []), ...(s.reset[recDay] || [])])];
    const medHabit = s.habits.find(h => h.tpl === "meditate" && h.type === "timer");
    const medMin = medHabit ? Math.max(Habits.val(medHabit, relDay), Habits.val(medHabit, recDay)) : 0;
    const tasks = [
      { id: "reflect", e: "✍️", t: "Reflecteer: schrijf op wat er vlak ervoor gebeurde", act: "journal", done: s.journal.some(j => j.ts > r.ts) },
      { id: "breath", e: "🌬️", t: "Ademhaling of lichttherapie", act: "breath", done: log.some(x => x.kind === "breath" || x.kind === "light") },
      { id: "meditate", e: "🧘", t: "10 min meditatie of urge surfing", act: "surf", done: log.some(x => x.kind === "meditate" && x.sec >= 300) || medMin >= 10 },
      { id: "reset", e: "⚡", t: `Dopamine Reset: minstens 6 van 8 (${(s.reset[recDay] || []).length}/8)`, act: "reset", done: (s.reset[recDay] || []).length >= 6 },
      { id: "move", e: "🏃", t: "Beweeg of neem een koude douche", act: "reset", done: reset.includes("move") || reset.includes("cold") },
      { id: "checkin", e: "😊", t: "Check-in: hoe gaat het nu?", act: "checkin", done: !!(s.checkins[recDay] || s.checkins[relDay] && s.checkins[relDay].ts > r.ts) }
    ];
    const done = tasks.filter(t => t.done).length;
    return { relapse: r, relDay, recDay, isToday: Store.dayKey() === recDay, tasks, done, complete: done === tasks.length };
  }

  function recoveryCardHtml() {
    const rc = recovery();
    if (!rc) return "";
    const s = S();
    if (rc.complete && (s.recoveryDone || {})[rc.relapse.ts]) return "";
    return `<div class="card rc-recovery" data-anim>
      <div class="row between"><div><div style="font-weight:700;font-size:17px">🩹 ${rc.isToday ? "Vandaag is je hersteldag" : "Hersteldag"}</div>
        <div class="small muted">${rc.isToday ? "Zet je brein terug op koers." : "Begint morgen, je kunt nu al starten."}</div></div>
        <b class="rc-count">${rc.done}/${rc.tasks.length}</b></div>
      <div class="bar" style="height:6px;margin:12px 0 6px"><i style="width:${rc.done / rc.tasks.length * 100}%;background:linear-gradient(90deg,#34d399,#22d3ee)"></i></div>
      ${rc.tasks.map(t => `<button class="list-item ${t.done ? "done" : ""}" data-recovery="${t.act}" style="width:100%;text-align:left;padding:10px 2px">
        <span class="li-ico" style="width:32px;height:32px;font-size:16px">${t.e}</span><span class="li-body"><div class="li-title" style="font-size:14px">${esc(t.t)}</div></span>
        <span class="check">${FX.checkIcon}</span></button>`).join("")}
    </div>`;
  }

  /* When all recovery tasks are done: celebrate once */
  function checkRecovery() {
    const rc = recovery();
    if (!rc || !rc.complete) return false;
    const s = S(); s.recoveryDone = s.recoveryDone || {};
    if (s.recoveryDone[rc.relapse.ts] || $("#fs-root").children.length) return false;
    s.recoveryDone[rc.relapse.ts] = true; Store.save();
    fullscreen(`
      <div class="fs-center"><div class="rw-big">💪</div><h2 style="font-size:32px" data-t>Herstel voltooid</h2>
      <p class="muted" style="font-size:17px;margin-top:10px;max-width:320px" data-t>Je hebt de terugval niet laten winnen. Dit is precies hoe je brein leert terug te veren.</p></div>
      <div class="fs-bottom"><button class="btn" data-close>Door naar vandaag</button></div>`, {
      bg: "radial-gradient(circle at 50% 40%, #0f3b2c, #05050a 70%)",
      onClose() { if (window.App) App.refresh(false); },
      onMount(el) { gsap.from($$("[data-t],.rw-big", el), { y: 24, opacity: 0, stagger: 0.12, duration: 0.6 }); setTimeout(() => { confetti(90); Sound.success(); }, 300); }
    });
    return true;
  }

  window.Rewards = { cardHtml, manage, checkUnlock, recovery, recoveryCardHtml, checkRecovery, PRESETS };
})();
