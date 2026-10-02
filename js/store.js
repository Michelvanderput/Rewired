/* Persistent state in localStorage */
(function () {
  const KEY = "rewired.v1";
  const DAY = 86400000;

  const defaults = () => ({
    onboarded: false,
    name: "",
    startDate: Date.now(),
    firstStart: Date.now(),
    bestStreak: 0,
    goalDays: 90,
    reasons: [],
    triggers: [],
    pledge: "",
    signature: "",
    relapses: [],        // [{ts, trigger, note, streakMs}]
    urges: [],           // [{ts, intensity, trigger, resisted, note, place, feeling}]
    checkins: {},        // {"YYYY-MM-DD": {mood, energy, note}}
    reset: {},           // {"YYYY-MM-DD": [taskId]}
    habits: DATA.defaultHabits.slice(),
    habitLog: {},        // {"YYYY-MM-DD": [habitId]}  (completed habits)
    habitVal: {},        // {"YYYY-MM-DD": {habitId: value}} (counts, minutes, time of day)
    habitTimer: {},      // {habitId: {start, day}} running timers
    habitStatus: {},     // {"YYYY-MM-DD": {habitId: {s: "min"|"skip", why}}}
    journal: [],         // [{ts, text, mood}]
    lessonsDone: [],
    sessions: { light: 0, breath: 0, meditate: 0, panic: 0, minutes: 0 },
    settings: { sound: true, haptics: true, lightWarned: false }
  });

  let state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? Object.assign(defaults(), JSON.parse(raw)) : defaults();
  } catch {
    state = defaults();
  }

  const dayKey = (d = new Date()) => {
    const x = new Date(d);
    return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0");
  };

  const Store = {
    DAY,
    get s() { return state; },
    dayKey,
    save() {
      state.updatedAt = Date.now();
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
    },
    /* replace the whole state (used by cloud sync) without bumping updatedAt */
    replace(next) {
      state = Object.assign(defaults(), next);
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    },
    set(patch) { Object.assign(state, patch); this.save(); },
    reset() { state = defaults(); this.save(); },
    export() { return JSON.stringify(state, null, 2); },
    import(json) { state = Object.assign(defaults(), JSON.parse(json)); this.save(); },

    streakMs() { return Math.max(0, Date.now() - state.startDate); },
    streakDays() { return Math.floor(this.streakMs() / DAY); },
    bestDays() { return Math.max(state.bestStreak ? Math.floor(state.bestStreak / DAY) : 0, this.streakDays()); },
    rewirePct() { return Math.min(100, (this.streakMs() / (DATA.REWIRE_DAYS * DAY)) * 100); },

    nextMilestone() {
      const d = this.streakDays();
      return DATA.milestones.find(m => m.d > d) || { d: d + 100, t: (d + 100) + " dagen", e: "✨" };
    },
    prevMilestoneDay() {
      const d = this.streakDays();
      const done = DATA.milestones.filter(m => m.d <= d);
      return done.length ? done[done.length - 1].d : 0;
    },

    relapse(trigger, note, extra = {}) {
      const ms = this.streakMs();
      if (ms > state.bestStreak) state.bestStreak = ms;
      state.relapses.push(Object.assign({ ts: Date.now(), trigger, note, streakMs: ms }, extra));
      state.startDate = Date.now();
      this.save();
    },

    logUrge(u) { state.urges.push(Object.assign({ ts: Date.now() }, u)); this.save(); },

    toggleIn(mapKey, id, key = dayKey()) {
      const map = state[mapKey];
      const arr = map[key] || (map[key] = []);
      const i = arr.indexOf(id);
      if (i >= 0) arr.splice(i, 1); else arr.push(id);
      this.save();
      return i < 0;
    },

    checkin(data) { state.checkins[dayKey()] = Object.assign({ ts: Date.now() }, data); this.save(); },

    resetDoneToday() { return (state.reset[dayKey()] || []).length; },

    resisted() { return state.urges.filter(u => u.resisted).length; },

    /* 0-100: streak, consistency of daily actions, urge resistance */
    discipline() {
      const streak = Math.min(1, this.streakDays() / 30);
      let active = 0;
      for (let i = 0; i < 7; i++) {
        const k = dayKey(Date.now() - i * DAY);
        const r = (state.reset[k] || []).length / DATA.resetTasks.length;
        const done = window.Habits ? Habits.doneCount(k) : (state.habitLog[k] || []).length;
        const h = state.habits.length ? done / state.habits.length : 0;
        const c = state.checkins[k] ? 1 : 0;
        active += Math.min(1, r * 0.5 + h * 0.3 + c * 0.2);
      }
      active /= 7;
      const recent = state.urges.filter(u => u.ts > Date.now() - 30 * DAY);
      const resist = recent.length ? recent.filter(u => u.resisted).length / recent.length : 0.7;
      return Math.round(streak * 40 + active * 35 + resist * 25);
    },

    dayStatus(key) {
      const start = dayKey(Math.min(state.firstStart || state.startDate, state.startDate));
      if (state.relapses.some(r => dayKey(r.ts) === key)) return "relapse";
      if (state.checkins[key]) return "check";
      if (key >= start && key <= dayKey()) return "clean";
      return "";
    }
  };

  window.Store = Store;
})();
