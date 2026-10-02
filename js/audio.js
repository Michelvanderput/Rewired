/* Tiny WebAudio synth: UI sounds, ambient noise, binaural tones. No audio files needed. */
(function () {
  let ctx = null;
  const on = () => Store.s.settings.sound;

  function ac() {
    if (!ctx) {
      const C = window.AudioContext || window.webkitAudioContext;
      if (!C) return null;
      ctx = new C();
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }
  // iOS needs a user gesture to start audio
  document.addEventListener("touchend", () => ac(), { once: true, passive: true });
  document.addEventListener("click", () => ac(), { once: true });

  function blip(freq = 660, dur = 0.08, type = "sine", vol = 0.06, when = 0) {
    if (!on()) return;
    const c = ac(); if (!c) return;
    const t = c.currentTime + when;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noiseBuffer(c, kind) {
    const len = c.sampleRate * 4;
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === "brown") { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
        else d[i] = w * 0.4;
      }
    }
    return buf;
  }

  // "playback" ignores the iPhone silent switch; used only during sessions
  function session(on) {
    try { if (navigator.audioSession) navigator.audioSession.type = on ? "playback" : "auto"; } catch {}
  }

  const Sound = {
    tap() { blip(880, 0.05, "sine", 0.035); },
    toggle(onState) { onState ? (blip(660, 0.07), blip(990, 0.1, "sine", 0.05, 0.06)) : blip(440, 0.08); },
    success() { [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.25, "triangle", 0.05, i * 0.09)); },
    soft() { blip(392, 0.4, "sine", 0.04); },
    bell() {
      if (!on()) return;
      [528, 792, 1056].forEach((f, i) => blip(f, 2.4 - i * 0.5, "sine", 0.05 / (i + 1)));
    },

    /* Ambient noise bed (brown = ocean/rain-like). Returns stop() */
    ambient(kind = "brown", vol = 0.22) {
      if (!on()) return () => {};
      const c = ac(); if (!c) return () => {};
      session(true);
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c, kind); src.loop = true;
      const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = kind === "brown" ? 900 : 1600;
      const g = c.createGain(); g.gain.value = 0;
      // slow swell for a wave-like feel
      const lfo = c.createOscillator(), lfoG = c.createGain();
      lfo.frequency.value = 0.08; lfoG.gain.value = vol * 0.35;
      lfo.connect(lfoG).connect(g.gain);
      src.connect(lp).connect(g).connect(c.destination);
      g.gain.linearRampToValueAtTime(vol, c.currentTime + 2.5);
      src.start(); lfo.start();
      return () => {
        const t = c.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + 1.2);
        src.stop(t + 1.3); lfo.stop(t + 1.3);
        session(false);
      };
    },

    /* Binaural beat: base Hz left, base+beat right (use headphones). Returns stop() */
    binaural(base = 200, beat = 10, vol = 0.07) {
      if (!on()) return () => {};
      const c = ac(); if (!c || !c.createStereoPanner) return () => {};
      session(true);
      const g = c.createGain(); g.gain.value = 0; g.connect(c.destination);
      const mk = (f, pan) => {
        const o = c.createOscillator(), p = c.createStereoPanner();
        o.frequency.value = f; p.pan.value = pan; o.connect(p).connect(g); o.start(); return o;
      };
      const oscs = [mk(base, -1), mk(base + beat, 1)];
      g.gain.linearRampToValueAtTime(vol, c.currentTime + 2);
      return () => {
        const t = c.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0, t + 1);
        oscs.forEach(o => o.stop(t + 1.1));
        session(false);
      };
    },

    /* Rising / falling tone to guide breathing */
    breath(phase, dur) {
      if (!on()) return;
      const c = ac(); if (!c) return;
      const t = c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine";
      const from = phase === "out" ? 330 : 220, to = phase === "out" ? 220 : phase.startsWith("hold") ? 220 : 330;
      if (phase.startsWith("hold")) { o.frequency.value = phase === "hold" ? 330 : 220; }
      else { o.frequency.setValueAtTime(from, t); o.frequency.linearRampToValueAtTime(to, t + dur); }
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(phase.startsWith("hold") ? 0.015 : 0.04, t + Math.min(0.8, dur / 3));
      g.gain.linearRampToValueAtTime(0, t + dur);
      o.connect(g).connect(c.destination);
      o.start(t); o.stop(t + dur + 0.05);
    }
  };

  window.Sound = Sound;
})();
