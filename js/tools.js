/* Immersive tools: light therapy, breathing, meditation, panic mode */
(function () {
  const { $, $$, esc, haptic, toast, confetti, sheet, fullscreen, wake, closeIcon, fmtClock } = FX;

  function addSession(kind, seconds) {
    const s = Store.s.sessions;
    s[kind] = (s[kind] || 0) + 1;
    s.minutes = (s.minutes || 0) + Math.round(seconds / 60);
    Store.save();
    if (window.Habits) Habits.onSession(kind, seconds);
  }

  function segHtml(name, opts, val) {
    return `<div class="seg" data-seg="${name}">${opts.map(o => `<button data-v="${o[0]}" class="${o[0] == val ? "on" : ""}">${o[1]}</button>`).join("")}</div>`;
  }
  function bindSeg(root, name, cb) {
    const seg = root.querySelector(`[data-seg="${name}"]`);
    seg.addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      $$("button", seg).forEach(x => x.classList.toggle("on", x === b));
      haptic(); Sound.tap(); cb(b.dataset.v);
    });
  }

  function doneScreen(el, { title, sub, onDone, emoji = "✨" }) {
    const wrap = document.createElement("div");
    wrap.className = "fs-center";
    wrap.style.cssText = "position:absolute;inset:0;padding:0 28px;z-index:10;background:rgba(5,5,10,.72);-webkit-backdrop-filter:blur(30px);backdrop-filter:blur(30px)";
    wrap.innerHTML = `
      <div style="font-size:72px" class="d-e">${emoji}</div>
      <h2 style="font-size:32px;margin-top:14px" class="d-t">${title}</h2>
      <p class="muted d-s" style="margin-top:10px;font-size:17px;max-width:320px">${sub}</p>
      <div style="width:100%;margin-top:34px" class="d-b"><button class="btn">Klaar</button></div>`;
    el.appendChild(wrap);
    gsap.fromTo(wrap, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    gsap.fromTo(wrap.querySelector(".d-e"), { scale: 0, rotation: -30 }, { scale: 1, rotation: 0, duration: 0.9, ease: "elastic.out(1,0.5)", delay: 0.15 });
    gsap.fromTo(wrap.querySelectorAll(".d-t,.d-s,.d-b"), { y: 24, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, delay: 0.3, duration: 0.6, ease: "power3.out" });
    Sound.success(); haptic([20, 40, 20]);
    confetti(60);
    wrap.querySelector("button").addEventListener("click", onDone);
  }

  /* ================= LIGHT THERAPY ================= */
  function lightPicker() {
    let mode = DATA.lightModes[0].id, mins = 3, tone = true;
    sheet(`
      <h2>Lichttherapie</h2>
      <p class="sub">NeuroPulse sessies onderbreken het drangpatroon, kalmeren je zenuwstelsel en richten je aandacht opnieuw. Zet je helderheid omhoog.</p>
      <div data-modes>${DATA.lightModes.map((m, i) => `
        <button class="mode-card ${i === 0 ? "on" : ""}" data-id="${m.id}">
          <span class="mode-swatch" style="background:${m.swatch}"></span>
          <span><div style="font-weight:600">${m.name}</div><div class="muted small">${m.sub}</div></span>
        </button>`).join("")}</div>
      <label class="lbl">Duur</label>
      ${segHtml("mins", [[1, "1 min"], [3, "3 min"], [5, "5 min"], [10, "10 min"]], mins)}
      <label class="lbl">Binaurale toon (koptelefoon)</label>
      ${segHtml("tone", [[1, "Aan"], [0, "Uit"]], 1)}
      <div style="margin-top:24px"><button class="btn" data-start>Start sessie</button></div>
      <p class="muted small" style="margin-top:14px;text-align:center">Licht gevoelig of epilepsie? Gebruik alleen Rood licht, Blauw of Aurora.</p>
    `, {
      onMount(sh, close) {
        const modes = $("[data-modes]", sh);
        modes.addEventListener("click", e => {
          const b = e.target.closest(".mode-card"); if (!b) return;
          $$(".mode-card", modes).forEach(x => x.classList.toggle("on", x === b));
          mode = b.dataset.id; haptic(); Sound.tap();
          gsap.fromTo(b.querySelector(".mode-swatch"), { scale: 0.8 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
        });
        bindSeg(sh, "mins", v => mins = +v);
        bindSeg(sh, "tone", v => tone = v === "1");
        $("[data-start]", sh).addEventListener("click", () => { close(); setTimeout(() => lightSession(mode, mins, tone), 250); });
      }
    });
  }

  function lightSession(modeId, mins, tone) {
    const m = DATA.lightModes.find(x => x.id === modeId);
    const total = mins * 60;
    let stopTone = () => {}, tl, hintTl, raf, startedAt;

    fullscreen(`
      <div class="light-layer" data-layer></div>
      <div class="fs-top"><button class="icon-btn" data-close>${closeIcon}</button><span class="small" style="opacity:.8;text-shadow:0 1px 8px #000">${m.name}</span><span style="width:44px"></span></div>
      <div class="fs-center">
        <div class="light-timer" data-t>${fmtClock(total)}</div>
        <div class="light-hint" data-h>${m.hints[0]}</div>
      </div>
      <div class="fs-bottom" style="text-align:center"><span class="small" style="opacity:.6">Kijk ontspannen naar het scherm</span></div>
    `, {
      bg: "#000",
      onMount(el, close) {
        const layer = $("[data-layer]", el);
        const W = innerWidth;
        if (m.type === "cycle") {
          layer.style.background = m.colors[0];
          tl = gsap.timeline({ repeat: -1 });
          m.colors.concat([m.colors[0]]).slice(1).forEach(c => tl.to(layer, { backgroundColor: c, duration: m.speed, ease: "sine.inOut" }));
        } else if (m.type === "pulse") {
          layer.style.background = `radial-gradient(circle at 50% 50%, ${m.colors[1]} 0%, ${m.colors[0]} 60%, #000 100%)`;
          tl = gsap.timeline({ repeat: -1, yoyo: true }).fromTo(layer, { opacity: 0.35, scale: 1 }, { opacity: 1, scale: 1.15, duration: m.speed, ease: "sine.inOut" });
        } else if (m.type === "bilateral") {
          layer.style.background = "radial-gradient(circle at 50% 50%, #140a2e, #000)";
          const orb = document.createElement("div"); orb.className = "light-orb";
          orb.style.background = `radial-gradient(circle, #fff 0%, ${m.colors[0]} 35%, transparent 70%)`;
          layer.appendChild(orb);
          const span = W / 2 - 60;
          gsap.set(orb, { x: -span });
          tl = gsap.timeline({ repeat: -1, yoyo: true })
            .to(orb, { x: span, duration: m.speed, ease: "sine.inOut" })
            .to(orb, { background: `radial-gradient(circle, #fff 0%, ${m.colors[1]} 35%, transparent 70%)`, duration: m.speed, ease: "none" }, 0);
        } else {
          layer.style.background = "#02020a";
          m.colors.forEach((c, i) => {
            const b = document.createElement("div");
            b.className = "light-orb";
            b.style.cssText += `width:${W * 1.1}px;height:${W * 1.1}px;margin:${-W * 0.55}px 0 0 ${-W * 0.55}px;background:radial-gradient(circle, ${c} 0%, transparent 65%);filter:blur(30px);mix-blend-mode:screen;opacity:.8`;
            layer.appendChild(b);
            gsap.to(b, { x: gsap.utils.random(-W * .4, W * .4), y: gsap.utils.random(-W * .7, W * .7), scale: gsap.utils.random(0.7, 1.4), duration: m.speed + i, repeat: -1, yoyo: true, ease: "sine.inOut", delay: -i * 2 });
          });
        }
        if (tone) stopTone = Sound.binaural(modeId === "blue" ? 220 : 180, modeId === "blue" ? 14 : modeId === "red" ? 6 : 10);
        wake(true);

        // rotating hints
        const h = $("[data-h]", el);
        let hi = 0;
        hintTl = setInterval(() => {
          hi = (hi + 1) % m.hints.length;
          gsap.to(h, { opacity: 0, y: -8, duration: 0.5, onComplete: () => { h.textContent = m.hints[hi]; gsap.fromTo(h, { opacity: 0, y: 8 }, { opacity: 0.85, y: 0, duration: 0.6 }); } });
        }, 9000);

        startedAt = performance.now();
        const t = $("[data-t]", el);
        gsap.from(t, { scale: 0.6, opacity: 0, duration: 1, ease: "expo.out" });
        const loop = () => {
          const left = total - (performance.now() - startedAt) / 1000;
          t.textContent = fmtClock(left);
          if (left <= 0) {
            cleanup();
            addSession("light", total);
            doneScreen(el, { title: "Sessie voltooid", sub: "Je hebt je brein een reset gegeven. Merk op hoe de drang nu voelt.", emoji: "💡", onDone: close });
            return;
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      },
      onClose() { cleanup(); }
    });

    function cleanup() {
      cancelAnimationFrame(raf); clearInterval(hintTl);
      if (tl) tl.kill();
      stopTone(); stopTone = () => {};
      wake(false);
    }
  }

  function openLight() {
    if (!Store.s.settings.lightWarned) {
      sheet(`
        <h2>Voor je begint ⚠️</h2>
        <p class="sub">Lichttherapie gebruikt langzaam wisselende kleuren en pulserend licht. Heb je (foto-gevoelige) epilepsie of migraine door licht? Gebruik dan geen Pattern Interrupt of Bilateraal en overleg met een arts.</p>
        <p class="muted" style="margin-bottom:22px">Dit is een zelfhulp-tool en geen medische behandeling.</p>
        <button class="btn" data-ok>Ik begrijp het</button>`, {
        onMount(sh, close) {
          $("[data-ok]", sh).addEventListener("click", () => {
            Store.s.settings.lightWarned = true; Store.save(); close(); setTimeout(lightPicker, 300);
          });
        }
      });
    } else lightPicker();
  }

  /* ================= BREATHING ================= */
  function breathPicker() {
    sheet(`
      <h2>Ademhaling</h2>
      <p class="sub">Je adem is de snelste weg naar je zenuwstelsel. Kies een techniek.</p>
      <div data-list>${DATA.breathPatterns.map(p => `
        <button class="mode-card" data-id="${p.id}">
          <span class="mode-swatch" style="background:radial-gradient(circle at 40% 35%,#a5f3fc,#22d3ee 40%,#7c5cff);display:grid;place-items:center;font-size:20px">🌬️</span>
          <span><div style="font-weight:600">${p.name}</div><div class="muted small">${p.sub}</div></span>
        </button>`).join("")}</div>`, {
      onMount(sh, close) {
        $("[data-list]", sh).addEventListener("click", e => {
          const b = e.target.closest(".mode-card"); if (!b) return;
          haptic(); Sound.tap(); close();
          setTimeout(() => breathSession(b.dataset.id), 250);
        });
      }
    });
  }

  function breathSession(id, { rounds, onFinish, embedIn } = {}) {
    const p = DATA.breathPatterns.find(x => x.id === id);
    const R = rounds || p.rounds;
    const cycle = p.steps.reduce((a, s) => a + s[1], 0);
    const scales = { in: 1.7, in2: 1.95, hold: null, out: 0.75, holdOut: null };
    let tl;

    const html = `
      <div class="fs-top"><button class="icon-btn" data-close>${closeIcon}</button><span class="small muted">${p.name}</span><span class="small muted" data-r style="width:44px;text-align:right">1/${R}</span></div>
      <div class="fs-center">
        <div class="breath-stage">
          <svg viewBox="0 0 290 290" width="290" height="290" style="position:absolute;inset:0;transform:rotate(-90deg)">
            <circle cx="145" cy="145" r="138" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="3"/>
            <circle data-ring cx="145" cy="145" r="138" fill="none" stroke="url(#bg1)" stroke-width="3" stroke-linecap="round" stroke-dasharray="867" stroke-dashoffset="867"/>
            <defs><linearGradient id="bg1"><stop offset="0" stop-color="#22d3ee"/><stop offset="1" stop-color="#7c5cff"/></linearGradient></defs>
          </svg>
          <div class="breath-halo" data-halo></div>
          <div class="breath-circle" data-c></div>
        </div>
        <div class="breath-label" data-l>Maak je klaar</div>
        <div class="breath-count" data-n>&nbsp;</div>
      </div>
      <div class="fs-bottom" style="text-align:center"><span class="small muted">Totaal ${fmtClock(cycle * R)}</span></div>`;

    const run = (el, close) => {
      const c = $("[data-c]", el), halo = $("[data-halo]", el), L = $("[data-l]", el), N = $("[data-n]", el), ring = $("[data-ring]", el), rr = $("[data-r]", el);
      gsap.set(c, { scale: 0.75 }); gsap.set(halo, { scale: 0.75 });
      wake(true);
      tl = gsap.timeline({ delay: 1.2, onComplete: () => {
        wake(false);
        addSession("breath", cycle * R);
        if (onFinish) onFinish(el, close);
        else doneScreen(el, { title: "Goed gedaan", sub: `${R} rondes voltooid. Je zenuwstelsel is gekalmeerd.`, emoji: "🌬️", onDone: close });
      } });
      for (let r = 0; r < R; r++) {
        tl.call(() => { rr.textContent = (r + 1) + "/" + R; });
        tl.set(ring, { strokeDashoffset: 867 });
        const rs = tl.duration();
        tl.to(ring, { strokeDashoffset: 0, duration: cycle, ease: "none" }, rs);
        let at = rs;
        p.steps.forEach(([label, dur, phase]) => {
          tl.call(() => {
            gsap.fromTo(L, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4 });
            L.textContent = label;
            Sound.breath(phase, dur); haptic(8);
          }, null, at);
          const cnt = { v: dur };
          tl.to(cnt, { v: 0, duration: dur, ease: "none", onUpdate: () => { N.textContent = Math.ceil(cnt.v); } }, at);
          if (scales[phase] != null) {
            tl.to(c, { scale: scales[phase], duration: dur, ease: phase === "out" ? "sine.inOut" : "sine.out" }, at);
            tl.to(halo, { scale: scales[phase] * 1.25, opacity: phase === "out" ? 0.2 : 0.8, duration: dur, ease: "sine.inOut" }, at);
          } else {
            tl.to(c, { scale: "+=0.04", duration: dur / 2, yoyo: true, repeat: 1, ease: "sine.inOut" }, at);
          }
          at += dur;
        });
      }
    };

    if (embedIn) { embedIn.innerHTML = html; run(embedIn, () => {}); return () => { if (tl) tl.kill(); wake(false); }; }
    fullscreen(html, { onMount: run, onClose() { if (tl) tl.kill(); wake(false); } });
  }

  /* ================= MEDITATION ================= */
  function meditationPicker(preselect) {
    let sel = preselect || DATA.meditations[0].id;
    let mins = DATA.meditations.find(m => m.id === sel).min, amb = true;
    sheet(`
      <h2>Meditatie</h2>
      <p class="sub">Train je aandacht. Elke keer dat je terugkeert naar het nu, versterk je zelfbeheersing.</p>
      <div data-list>${DATA.meditations.map(m => `
        <button class="mode-card ${m.id === sel ? "on" : ""}" data-id="${m.id}">
          <span class="mode-swatch" style="background:rgba(124,92,255,.18);display:grid;place-items:center;font-size:24px">${m.e}</span>
          <span><div style="font-weight:600">${m.name}</div><div class="muted small">${m.sub}</div></span>
        </button>`).join("")}</div>
      <label class="lbl">Duur</label>
      ${segHtml("mins", [[3, "3"], [5, "5"], [10, "10"], [15, "15"], [20, "20 min"]], mins)}
      <label class="lbl">Ambient geluid</label>
      ${segHtml("amb", [[1, "Oceaan"], [0, "Stilte"]], 1)}
      <div style="margin-top:24px"><button class="btn" data-start>Begin</button></div>`, {
      onMount(sh, close) {
        const list = $("[data-list]", sh);
        list.addEventListener("click", e => {
          const b = e.target.closest(".mode-card"); if (!b) return;
          $$(".mode-card", list).forEach(x => x.classList.toggle("on", x === b));
          sel = b.dataset.id; haptic(); Sound.tap();
        });
        bindSeg(sh, "mins", v => mins = +v);
        bindSeg(sh, "amb", v => amb = v === "1");
        $("[data-start]", sh).addEventListener("click", () => { close(); setTimeout(() => meditation(sel, mins, amb), 250); });
      }
    });
  }

  function meditation(id, mins, amb) {
    const m = DATA.meditations.find(x => x.id === id);
    const total = mins * 60;
    let stopAmb = () => {}, raf, tweens = [], promptIdx = -1;
    fullscreen(`
      <div data-parts style="position:absolute;inset:0;overflow:hidden"></div>
      <div class="fs-top"><button class="icon-btn" data-close>${closeIcon}</button><span class="small muted">${m.name}</span><button class="icon-btn" data-pause><svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg></button></div>
      <div class="fs-center">
        <div class="med-orb" data-orb>
          <div class="layer" style="background:radial-gradient(circle at 40% 40%,#7c5cff,transparent 70%)"></div>
          <div class="layer" style="background:radial-gradient(circle at 60% 50%,#22d3ee,transparent 70%)"></div>
          <div class="layer" style="background:radial-gradient(circle at 50% 65%,#f472b6,transparent 70%)"></div>
        </div>
        <div class="med-prompt" data-p>${m.prompts.length ? "" : "Adem. Wees hier."}</div>
      </div>
      <div class="fs-bottom" style="text-align:center">
        <div class="light-timer" style="font-size:34px" data-t>${fmtClock(total)}</div>
        <div class="bar" style="margin-top:14px"><i data-bar></i></div>
      </div>`, {
      bg: "radial-gradient(circle at 50% 40%, #151030, #05050a 70%)",
      onMount(el, close) {
        const orb = $("[data-orb]", el), layers = $$(".layer", orb);
        tweens.push(gsap.to(orb, { scale: 1.18, duration: 5, repeat: -1, yoyo: true, ease: "sine.inOut" }));
        layers.forEach((l, i) => tweens.push(gsap.to(l, { rotation: i % 2 ? -360 : 360, x: [18, -14, 10][i], duration: 14 + i * 5, repeat: -1, ease: "none", transformOrigin: "45% 55%" })));
        // floating particles
        const parts = $("[data-parts]", el);
        for (let i = 0; i < 28; i++) {
          const d = document.createElement("i"); d.className = "particle"; parts.appendChild(d);
          gsap.set(d, { x: Math.random() * innerWidth, y: innerHeight + 20, opacity: Math.random() * 0.6 + 0.1, scale: Math.random() * 1.5 + 0.5 });
          tweens.push(gsap.to(d, { y: -20, x: "+=" + gsap.utils.random(-60, 60), duration: gsap.utils.random(10, 22), repeat: -1, delay: -Math.random() * 20, ease: "none" }));
        }
        if (amb) stopAmb = Sound.ambient("brown");
        Sound.bell(); wake(true);

        const P = $("[data-p]", el), T = $("[data-t]", el), B = $("[data-bar]", el);
        let elapsed = 0, last = performance.now(), paused = false;
        $("[data-pause]", el).addEventListener("click", e => {
          paused = !paused; haptic(); Sound.tap();
          e.currentTarget.innerHTML = paused ? '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>' : '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>';
          tweens.forEach(t => paused ? t.pause() : t.resume());
        });
        const showPrompt = i => {
          if (i === promptIdx || !m.prompts[i]) return;
          promptIdx = i;
          gsap.to(P, { opacity: 0, filter: "blur(6px)", duration: 0.8, onComplete: () => {
            P.textContent = m.prompts[i];
            gsap.to(P, { opacity: 1, filter: "blur(0px)", duration: 1.2 });
          } });
        };
        const loop = now => {
          if (!paused) elapsed += (now - last) / 1000;
          last = now;
          const left = total - elapsed;
          T.textContent = fmtClock(left);
          B.style.width = Math.min(100, (elapsed / total) * 100) + "%";
          if (m.prompts.length) showPrompt(Math.min(m.prompts.length - 1, Math.floor((elapsed / total) * m.prompts.length)));
          if (left <= 0) {
            cleanup(); Sound.bell();
            addSession("meditate", total);
            doneScreen(el, { title: "Meditatie voltooid", sub: `${mins} minuten aandacht getraind. Neem deze rust mee.`, emoji: "🧘", onDone: close });
            return;
          }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      },
      onClose() { cleanup(); }
    });
    function cleanup() {
      cancelAnimationFrame(raf);
      tweens.forEach(t => t.kill()); tweens = [];
      stopAmb(); stopAmb = () => {};
      wake(false);
    }
  }

  /* ================= PANIC MODE ================= */
  function panic() {
    haptic([30, 60, 30]);
    Store.s.sessions.panic = (Store.s.sessions.panic || 0) + 1; Store.save();
    const s = Store.s;
    const reasons = s.reasons.length ? s.reasons : ["Ik wil de controle over mijn leven terug", "Ik wil trots zijn op mezelf"];
    const days = Store.streakDays();
    let step = 0, stopBreath = null, pulse;
    const STEPS = 5;

    fullscreen(`
      <div class="fs-top"><button class="icon-btn" data-close>${closeIcon}</button><div class="dots" data-dots>${"<i></i>".repeat(STEPS)}</div><span style="width:44px"></span></div>
      <div class="fs-center" data-stage style="position:relative"></div>
      <div class="fs-bottom"><button class="btn" data-next>Verder</button></div>`, {
      bg: "radial-gradient(circle at 50% 30%, #5a0016 0%, #1a0008 55%, #05050a 100%)",
      onMount(el, close) {
        const stage = $("[data-stage]", el), next = $("[data-next]", el), dots = $$("[data-dots] i", el);

        const views = [
          () => `<div class="panic-step">
              <div class="panic-big" data-pulse>STOP.</div>
              <div class="panic-big" style="font-size:30px;margin-top:10px">Je hebt dit.</div>
              <p class="panic-sub">Deze drang is tijdelijk. Hij piekt en zakt binnen 15–20 minuten. Je hoeft hem alleen maar uit te zitten.</p>
            </div>`,
          () => `<div class="panic-step" data-breath style="padding:0"></div>`,
          () => `<div class="panic-step" style="justify-content:flex-start;padding-top:10px;overflow-y:auto">
              <div class="eyebrow">Je staat op</div>
              <div class="panic-big grad-text" style="font-size:64px">${days} ${days === 1 ? "dag" : "dagen"}</div>
              <p class="panic-sub" style="margin:8px 0 22px">Is een paar minuten het waard om dit weg te gooien? Onthoud waarom je begon:</p>
              ${reasons.map(r => `<div class="reason-card">💡 ${esc(r)}</div>`).join("")}
              ${s.pledge ? `<div class="reason-card" style="border-color:rgba(124,92,255,.5)">✍️ "${esc(s.pledge)}"</div>` : ""}
            </div>`,
          () => `<div class="panic-step">
              <div class="panic-big" style="font-size:32px">Verander je staat</div>
              <p class="panic-sub" style="margin-bottom:24px">Doe nu direct iets fysieks. Beweging verbreekt het patroon.</p>
              <div class="action-grid">
                <button data-act="light"><span>💡</span>Lichttherapie</button>
                <button data-act="surf"><span>🌊</span>Urge surfing</button>
                <button data-act="t:Zet de douche op koud. 60 seconden. Nu."><span>🧊</span>Koude douche</button>
                <button data-act="t:Laat je zakken: 20 push-ups. Tel hardop."><span>💪</span>20 push-ups</button>
                <button data-act="t:Pak je sleutels en loop 10 minuten naar buiten. Telefoon thuis."><span>🚶</span>Naar buiten</button>
                <button data-act="t:Bel of app iemand die je vertrouwt. Je hoeft niet te zeggen waarom."><span>📞</span>Bel iemand</button>
              </div>
            </div>`,
          () => `<div class="panic-step">
              <div style="font-size:64px" data-pulse>🛡️</div>
              <div class="panic-big" style="font-size:34px;margin-top:14px">Hoe gaat het nu?</div>
              <p class="panic-sub" style="margin-bottom:28px">Elke drang die je doorstaat maakt de volgende zwakker.</p>
              <button class="btn ok" data-win style="margin-bottom:12px">Ik heb het overleefd 💪</button>
              <button class="btn ghost" data-again style="margin-bottom:12px">Ik heb nog even nodig</button>
              <button class="btn ghost" data-lost style="color:var(--muted)">Ik ben teruggevallen</button>
            </div>`
        ];

        function render(dir = 1) {
          dots.forEach((d, i) => d.classList.toggle("on", i === step));
          if (stopBreath) { stopBreath(); stopBreath = null; }
          if (pulse) pulse.kill();
          const old = stage.firstElementChild;
          const wrap = document.createElement("div");
          wrap.innerHTML = views[step]();
          const nv = wrap.firstElementChild;
          stage.appendChild(nv);
          if (old) gsap.to(old, { x: -60 * dir, opacity: 0, duration: 0.35, ease: "power2.in", onComplete: () => old.remove() });
          gsap.fromTo(nv, { x: 60 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.55, delay: old ? 0.15 : 0, ease: "power3.out" });
          gsap.fromTo(nv.querySelectorAll(".reason-card,.action-grid button,.btn"), { y: 20, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.06, delay: 0.3, duration: 0.5, ease: "power2.out" });
          const p = nv.querySelector("[data-pulse]");
          if (p) pulse = gsap.to(p, { scale: 1.08, duration: 0.9, repeat: -1, yoyo: true, ease: "sine.inOut" });
          next.style.display = step === STEPS - 1 ? "none" : "";
          next.textContent = step === 1 ? "Overslaan" : "Verder";

          if (step === 1) {
            stopBreath = breathSession("sigh", {
              rounds: 3, embedIn: nv,
              onFinish: () => { next.textContent = "Verder"; gsap.fromTo(next, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "back.out(3)" }); }
            });
            const x = nv.querySelector("[data-close]"); if (x) x.style.visibility = "hidden";
            const top = nv.querySelector(".fs-top"); if (top) top.style.display = "none";
            nv.style.display = "flex"; nv.style.flexDirection = "column";
          }
          if (step === 0) gsap.to(el, { background: "radial-gradient(circle at 50% 30%, #5a0016 0%, #1a0008 55%, #05050a 100%)", duration: 1 });
          if (step >= 1) gsap.to(el, { background: "radial-gradient(circle at 50% 30%, #1b1450 0%, #0a0820 55%, #05050a 100%)", duration: 2 });
        }

        next.addEventListener("click", () => { haptic(); Sound.tap(); if (step < STEPS - 1) { step++; render(1); } });

        stage.addEventListener("click", e => {
          const a = e.target.closest("[data-act]");
          if (a) {
            haptic(); Sound.tap();
            const v = a.dataset.act;
            if (v === "light") { openLight(); return; }
            if (v === "surf") { meditationPicker("surf"); return; }
            toast(v.slice(2));
            gsap.fromTo(a, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: "back.out(3)" });
            a.style.borderColor = "rgba(52,211,153,.7)";
            return;
          }
          if (e.target.closest("[data-win]")) {
            Store.logUrge({ intensity: 7, trigger: "", resisted: true, note: "Paniekknop" });
            doneScreen(el, { title: "Drang verslagen!", sub: `Dat is ${Store.resisted()} gewonnen gevecht${Store.resisted() === 1 ? "" : "en"}. Je brein wordt sterker.`, emoji: "🏆", onDone: () => { close(); App.refresh(); } });
          }
          if (e.target.closest("[data-again]")) { step = 1; render(-1); }
          if (e.target.closest("[data-lost]")) { close(); setTimeout(() => App.relapseSheet(), 350); }
        });

        render();
      },
      onClose() { if (stopBreath) stopBreath(); if (pulse) pulse.kill(); }
    });
  }

  window.Tools = { openLight, breathPicker, breathSession, meditationPicker, panic, addSession };
})();
