/* Animation + UI helpers built on GSAP */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* iOS 18+ Safari: toggling a <input switch> via its label fires the system haptic.
     Elsewhere navigator.vibrate is used when available. */
  function haptic(pattern = 10) {
    if (!Store.s.settings.haptics) return;
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch {} return; }
    const l = document.getElementById("hapticLabel");
    if (l) l.click();
  }

  let toastTl;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    if (toastTl) toastTl.kill();
    toastTl = gsap.timeline()
      .fromTo(t, { xPercent: -50, yPercent: -160, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: "back.out(1.6)" })
      .to(t, { yPercent: -160, opacity: 0, duration: 0.4, ease: "power2.in" }, "+=2.2");
  }

  /* Reduced motion: iOS "Verminder beweging" or the in-app setting. Decorative loops, confetti and slides are skipped;
     functional animation (breathing guide, light therapy the user starts on purpose) stays. */
  const reduceMQ = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
  function calm() { return !!(Store.s.settings && Store.s.settings.calm) || reduceMQ.matches; }

  function confetti(count = 80) {
    if (calm()) return;
    const colors = ["#7c5cff", "#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#ffffff"];
    const W = innerWidth, H = innerHeight;
    for (let i = 0; i < count; i++) {
      const el = document.createElement("i");
      el.className = "confetti";
      el.style.background = colors[i % colors.length];
      if (i % 3 === 0) el.style.borderRadius = "50%";
      document.body.appendChild(el);
      gsap.set(el, { x: W / 2, y: H * 0.45, rotation: gsap.utils.random(0, 360), scale: gsap.utils.random(0.6, 1.2) });
      const angle = gsap.utils.random(-Math.PI, 0);
      const force = gsap.utils.random(200, 520);
      gsap.timeline({ onComplete: () => el.remove() })
        .to(el, { x: W / 2 + Math.cos(angle) * force, y: H * 0.45 + Math.sin(angle) * force, rotation: "+=" + gsap.utils.random(200, 720), duration: 0.9, ease: "power3.out" })
        .to(el, { y: H + 40, x: "+=" + gsap.utils.random(-80, 80), rotationX: 720, duration: gsap.utils.random(1.4, 2.4), ease: "power1.in" }, ">-0.1")
        .to(el, { opacity: 0, duration: 0.4 }, "<+=1");
    }
  }

  function countUp(el, to, { duration = 1.2, decimals = 0, suffix = "" } = {}) {
    if (!el) return;
    const o = { v: 0 };
    gsap.to(o, { v: to, duration, ease: "power3.out", onUpdate: () => { el.textContent = o.v.toFixed(decimals) + suffix; } });
  }

  /* Animate only what is on screen; everything below the fold is simply shown (cheaper on the phone) */
  function staggerIn(root) {
    const limit = root.getBoundingClientRect().bottom;
    const items = $$("[data-anim]", root).filter(el => el.getBoundingClientRect().top < limit);
    if (calm()) { gsap.fromTo(items, { opacity: 0 }, { opacity: 1, duration: 0.25, clearProps: "opacity" }); return; }
    gsap.fromTo(items, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out", stagger: 0.035, clearProps: "transform,opacity" });
  }

  /* Bottom sheet */
  function sheet(html, { onMount, onClose } = {}) {
    const root = $("#sheet-root");
    const bd = document.createElement("div"); bd.className = "sheet-backdrop";
    const sh = document.createElement("div"); sh.className = "sheet";
    sh.innerHTML = '<div class="grab"></div>' + html;
    root.append(bd, sh);
    gsap.fromTo(bd, { opacity: 0 }, { opacity: 1, duration: 0.3 });
    gsap.fromTo(sh, { yPercent: 100 }, { yPercent: 0, duration: 0.55, ease: "expo.out" });
    gsap.fromTo(sh.children, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.03, delay: 0.1, ease: "power2.out" });

    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      if (onClose) onClose();
      gsap.to(bd, { opacity: 0, duration: 0.25 });
      gsap.to(sh, { yPercent: 100, duration: 0.35, ease: "power3.in", onComplete: () => { bd.remove(); sh.remove(); } });
    };
    bd.addEventListener("click", close);

    // drag down to dismiss from the grab area / top of sheet
    let startY = null, dy = 0;
    sh.addEventListener("touchstart", e => { if (sh.scrollTop <= 0) { startY = e.touches[0].clientY; dy = 0; } }, { passive: true });
    sh.addEventListener("touchmove", e => {
      if (startY == null) return;
      dy = e.touches[0].clientY - startY;
      if (dy > 0 && !e.target.closest("input,textarea,.sig-pad")) gsap.set(sh, { y: dy });
    }, { passive: true });
    sh.addEventListener("touchend", () => {
      if (startY == null) return;
      startY = null;
      if (dy > 120) close(); else gsap.to(sh, { y: 0, duration: 0.3, ease: "power3.out" });
    });

    if (onMount) onMount(sh, close);
    return close;
  }

  /* Fullscreen experience */
  function fullscreen(html, { onMount, onClose, bg } = {}) {
    const root = $("#fs-root");
    const el = document.createElement("div"); el.className = "fs";
    if (bg) el.style.background = bg;
    el.innerHTML = html;
    root.appendChild(el);
    $("#panicBtn").classList.add("hidden");
    gsap.fromTo(el, { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" });
    let closed = false;
    const close = () => {
      if (closed) return; closed = true;
      if (onClose) onClose();
      gsap.to(el, { opacity: 0, scale: 0.98, duration: 0.35, ease: "power2.in", onComplete: () => {
        el.remove();
        if (!$("#fs-root").children.length) $("#panicBtn").classList.remove("hidden");
      } });
    };
    const x = el.querySelector("[data-close]");
    if (x) x.addEventListener("click", close);
    if (onMount) onMount(el, close);
    return close;
  }

  /* Keep the screen awake during sessions (iOS 16.4+) */
  let lock = null;
  async function wake(on) {
    try {
      if (on && "wakeLock" in navigator) lock = await navigator.wakeLock.request("screen");
      else if (!on && lock) { await lock.release(); lock = null; }
    } catch {}
  }

  /* Background blobs and the pulsing ring around the panic button: both endless, so both off in calm mode */
  function ambientBg() {
    gsap.killTweensOf(".b1,.b2,.b3,.panic-ring");
    if (calm()) { gsap.set(".b1,.b2,.b3", { x: 0, y: 0 }); gsap.set(".panic-ring", { scale: 1, opacity: 0 }); return; }
    gsap.to(".b1", { x: 120, y: 160, duration: 18, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".b2", { x: -100, y: -120, duration: 22, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".b3", { x: 140, y: -80, duration: 20, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.fromTo(".panic-ring", { scale: 1, opacity: 1 }, { scale: 1.35, opacity: 0, duration: 1.8, repeat: -1, ease: "power2.out" });
  }
  if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", () => ambientBg());

  const closeIcon = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  const checkIcon = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function fmtDur(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return [h, m, sec].map(n => String(n).padStart(2, "0")).join(":");
  }
  function fmtClock(sec) {
    sec = Math.max(0, Math.ceil(sec));
    return Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
  }
  function relTime(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) + " · " + d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  }

  window.FX = { $, $$, esc, calm, haptic, toast, confetti, countUp, staggerIn, sheet, fullscreen, wake, ambientBg, closeIcon, checkIcon, fmtDur, fmtClock, relTime };
})();
