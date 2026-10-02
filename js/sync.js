/* Account + end-to-end encrypted cloud sync.
   Password → PBKDF2 (600k, SHA-256) → 64 bytes: [authKey | encKey].
   authKey goes to the server (which hashes it again), encKey never leaves this device.
   The state is encrypted with AES-GCM before upload, so the server only stores ciphertext. */
(function () {
  const { $, esc, haptic, toast, sheet } = FX;
  const SESSION = "rewired.session";
  const ITER = 600000;
  const enc = new TextEncoder(), dec = new TextDecoder();

  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  const unb64 = s => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - s.length % 4) % 4)), c => c.charCodeAt(0));

  /* ---------- session (kept on this device only) ---------- */
  let sess = null;
  try { sess = JSON.parse(localStorage.getItem(SESSION) || "null"); } catch {}
  const saveSess = () => { try { sess ? localStorage.setItem(SESSION, JSON.stringify(sess)) : localStorage.removeItem(SESSION); } catch {} };

  /* ---------- crypto ---------- */
  async function derive(password, saltB64) {
    const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: unb64(saltB64), iterations: ITER }, base, 512));
    return { authKey: b64(bits.slice(0, 32)), encKey: b64(bits.slice(32)) };
  }
  const aesKey = raw => crypto.subtle.importKey("raw", unb64(raw), "AES-GCM", false, ["encrypt", "decrypt"]);

  async function seal(obj) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await aesKey(sess.key), enc.encode(JSON.stringify(obj)));
    return { iv: b64(iv), ct: b64(ct) };
  }
  async function open(blob) {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(blob.iv) }, await aesKey(sess.key), unb64(blob.ct));
    return JSON.parse(dec.decode(pt));
  }

  /* ---------- API ---------- */
  async function api(path, { method = "POST", body, auth = true } = {}) {
    const headers = { "Content-Type": "application/json" };
    if (auth && sess) headers.Authorization = "Bearer " + sess.token;
    const r = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
    let data = {}; try { data = await r.json(); } catch {}
    if (r.status === 401 && auth && sess && path !== "/api/auth") { expired(); }
    return { status: r.status, data };
  }

  function expired() {
    if (!sess) return;
    sess.expired = true; saveSess();
    toast("Sessie verlopen, log opnieuw in");
    rerender();
  }

  /* ---------- merge two states (local + remote) ---------- */
  const DEVICE_ONLY = ["push"];
  function strip(s) { const c = JSON.parse(JSON.stringify(s)); DEVICE_ONLY.forEach(k => delete c[k]); return c; }

  function merge(local, remote) {
    if (!remote) return local;
    if (!local.onboarded) return Object.assign({}, remote, { push: local.push });
    if (!remote.onboarded) return local;
    const newer = (local.updatedAt || 0) >= (remote.updatedAt || 0) ? local : remote;
    const older = newer === local ? remote : local;
    const out = JSON.parse(JSON.stringify(newer));
    const byTs = key => {
      const m = new Map();
      [...(older[key] || []), ...(newer[key] || [])].forEach(x => m.set(String(x.ts), x));
      out[key] = [...m.values()].sort((a, b) => a.ts - b.ts);
    };
    ["relapses", "urges", "journal", "sessionLog"].forEach(byTs);
    out.lessonSaved = [...new Set([...(older.lessonSaved || []), ...(newer.lessonSaved || [])])];
    out.quiz = Object.assign({}, older.quiz || {}, newer.quiz || {});
    out.learnLog = Object.assign({}, older.learnLog || {}, newer.learnLog || {});
    out.recoveryDone = Object.assign({}, older.recoveryDone || {}, newer.recoveryDone || {});
    out.reflections = Object.assign({}, older.reflections || {}, newer.reflections || {});
    out.rewardSeen = [...new Set([...(older.rewardSeen || []), ...(newer.rewardSeen || [])])];
    ["checkins", "reset", "habitLog"].forEach(k => { out[k] = Object.assign({}, older[k] || {}, newer[k] || {}); });
    out.habitVal = Object.assign({}, older.habitVal || {});
    Object.entries(newer.habitVal || {}).forEach(([d, m]) => { out.habitVal[d] = Object.assign({}, out.habitVal[d] || {}, m); });
    out.habitStatus = Object.assign({}, older.habitStatus || {});
    Object.entries(newer.habitStatus || {}).forEach(([d, m]) => { out.habitStatus[d] = Object.assign({}, out.habitStatus[d] || {}, m); });
    ["lessonsDone", "celebrated"].forEach(k => { out[k] = [...new Set([...(older[k] || []), ...(newer[k] || [])])]; });
    out.bestStreak = Math.max(local.bestStreak || 0, remote.bestStreak || 0);
    out.firstStart = Math.min(local.firstStart || Infinity, remote.firstStart || Infinity, local.startDate, remote.startDate);
    const lastRelapse = out.relapses.length ? out.relapses[out.relapses.length - 1].ts : 0;
    if (lastRelapse > out.startDate) out.startDate = lastRelapse;
    out.sessions = {};
    new Set([...Object.keys(local.sessions || {}), ...Object.keys(remote.sessions || {})]).forEach(k => {
      out.sessions[k] = Math.max((local.sessions || {})[k] || 0, (remote.sessions || {})[k] || 0);
    });
    out.push = local.push;
    out.updatedAt = Math.max(local.updatedAt || 0, remote.updatedAt || 0);
    return out;
  }

  /* ---------- sync ---------- */
  let busy = null, dirty = false, timer = null;

  function sync() {
    if (!sess || sess.expired) return Promise.resolve(false);
    if (busy) { dirty = true; return busy; }
    busy = (async () => {
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const r = await api("/api/data", { method: "GET" });
          if (r.status !== 200) return false;
          let state = Store.s;
          if (r.data.blob && r.data.rev !== sess.rev) {
            const remote = await open(r.data.blob);
            const merged = merge(Store.s, remote);
            Store.replace(merged);
            state = Store.s;
            sess.rev = r.data.rev; saveSess();
            if (JSON.stringify(strip(merged)) === JSON.stringify(strip(remote))) { sess.last = Date.now(); saveSess(); rerender(); return true; }
            rerender();
          } else if (r.data.rev === sess.rev && sess.pushed === state.updatedAt) {
            sess.last = Date.now(); saveSess(); return true; // nothing changed on either side
          }
          const put = await api("/api/data", { method: "PUT", body: { blob: await seal(strip(state)), baseRev: r.data.rev || 0 } });
          if (put.status === 200) {
            sess.rev = put.data.rev; sess.pushed = state.updatedAt; sess.last = Date.now(); saveSess();
            return true;
          }
          if (put.status !== 409) return false; // 409: another device saved first → loop and merge again
        }
        return false;
      } catch {
        return false;
      } finally {
        busy = null;
        updateStatus();
        if (dirty) { dirty = false; schedule(); }
      }
    })();
    return busy;
  }

  function schedule(ms = 2500) {
    if (!sess || sess.expired) return;
    clearTimeout(timer);
    timer = setTimeout(sync, ms);
  }

  // push local changes shortly after every save
  const save = Store.save.bind(Store);
  Store.save = function () { save(); schedule(); };

  /* ---------- account actions ---------- */
  const normUser = u => String(u || "").trim().toLowerCase();

  async function register(user, password) {
    user = normUser(user);
    const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
    const k = await derive(password, salt);
    const r = await api("/api/auth", { auth: false, body: { action: "register", user, salt, authKey: k.authKey } });
    if (r.status !== 200) throw new Error(r.data.error || "server");
    sess = { user, token: r.data.token, key: k.encKey, rev: 0 };
    saveSess();
    await sync();
  }

  async function login(user, password) {
    user = normUser(user);
    const s = await api("/api/auth", { auth: false, body: { action: "salt", user } });
    if (s.status !== 200) throw new Error(s.data.error || "server");
    const k = await derive(password, s.data.salt);
    const r = await api("/api/auth", { auth: false, body: { action: "login", user, authKey: k.authKey } });
    if (r.status !== 200) throw new Error(r.data.error || "server");
    sess = { user, token: r.data.token, key: k.encKey, rev: -1 };
    saveSess();
    const ok = await sync();
    if (!ok) throw new Error("sync");
  }

  async function logout() {
    if (sess && !sess.expired) await api("/api/auth", { body: { action: "logout" } }).catch(() => {});
    sess = null; saveSess();
  }

  async function deleteAccount(password) {
    const s = await api("/api/auth", { auth: false, body: { action: "salt", user: sess.user } });
    const k = await derive(password, s.data.salt);
    const r = await api("/api/auth", { body: { action: "delete", authKey: k.authKey } });
    if (r.status !== 200) throw new Error(r.data.error || "server");
    sess = null; saveSess();
  }

  /* ---------- UI ---------- */
  const ERR = {
    user_exists: "Deze gebruikersnaam is al bezet",
    wrong_credentials: "Gebruikersnaam of wachtwoord klopt niet",
    invalid_user: "Gebruikersnaam: 3–32 tekens, alleen a-z, 0-9, . _ -",
    rate_limited: "Te veel pogingen, probeer het over 15 minuten opnieuw",
    full: "Er kunnen geen nieuwe accounts meer bij",
    not_configured: "De server is nog niet ingesteld",
    sync: "Ingelogd, maar ophalen van je gegevens mislukte",
    server: "Er ging iets mis, probeer opnieuw"
  };
  const errText = e => ERR[e.message] || (e.name === "OperationError" ? "Ontsleutelen mislukt" : navigator.onLine ? ERR.server : "Geen internetverbinding");

  const rerender = () => { if (window.App) App.refresh(false); };
  let statusEl = null;
  function updateStatus() {
    if (!statusEl || !statusEl.isConnected || !sess) return;
    statusEl.textContent = sess.expired ? "Sessie verlopen" : sess.last ? "Gesynchroniseerd " + new Date(sess.last).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" }) : "Nog niet gesynchroniseerd";
  }

  function cardHtml() {
    if (!sess) return `
      <div class="card">
        <div style="font-weight:600">☁️ Veilig opslaan in de cloud</div>
        <p class="small muted" style="margin-top:6px;line-height:1.55">Maak een account zodat je streak, dagboek en voortgang bewaard blijven, ook als je een nieuwe telefoon krijgt. Alles wordt <b style="color:#fff">op je iPhone versleuteld</b>. Niemand anders kan het lezen.</p>
        <div class="grid2" style="margin-top:14px"><button class="btn sm" style="width:100%" data-acc="register">Account maken</button><button class="btn ghost sm" style="width:100%" data-acc="login">Inloggen</button></div>
      </div>`;
    return `
      <div class="card flush">
        <div class="list-item"><span class="li-ico">${sess.expired ? "⚠️" : "🔒"}</span><span class="li-body"><div class="li-title">${esc(sess.user)}</div><div class="li-sub" data-sync-status></div></span>
          ${sess.expired ? `<button class="btn sm" data-acc="login">Inloggen</button>` : `<button class="btn ghost sm" data-acc="sync">Sync</button>`}</div>
        <button class="list-item" style="width:100%;text-align:left" data-acc="logout"><span class="li-ico">↪️</span><span class="li-body"><div class="li-title">Uitloggen</div><div class="li-sub">Je gegevens blijven op deze telefoon staan</div></span></button>
        <button class="list-item" style="width:100%;text-align:left" data-acc="delete"><span class="li-ico">🗑️</span><span class="li-body"><div class="li-title danger-text">Account verwijderen</div><div class="li-sub">Wist je cloud-kopie, niet je telefoon</div></span></button>
      </div>`;
  }

  function mount(el) {
    if (!el) return;
    el.innerHTML = cardHtml();
    statusEl = el.querySelector("[data-sync-status]");
    updateStatus();
    el.onclick = async e => {
      const b = e.target.closest("[data-acc]"); if (!b) return;
      haptic(); Sound.tap();
      const a = b.dataset.acc;
      if (a === "register" || a === "login") return authSheet(a, rerender);
      if (a === "sync") {
        b.disabled = true; b.textContent = "…";
        const ok = await sync();
        toast(ok ? "Gesynchroniseerd ☁️" : "Synchroniseren mislukt");
        b.disabled = false; b.textContent = "Sync"; return;
      }
      if (a === "logout") { await logout(); toast("Uitgelogd"); rerender(); return; }
      if (a === "delete") return deleteSheet(rerender);
    };
  }

  function authSheet(mode, done, { afterLogin } = {}) {
    const reg = mode === "register";
    sheet(`
      <h2>${reg ? "Account maken" : "Inloggen"}</h2>
      <p class="sub">${reg ? "Je wachtwoord verlaat nooit je telefoon. Je gegevens worden ermee versleuteld voordat ze worden opgeslagen." : "Log in om je gegevens terug te halen en te synchroniseren."}</p>
      <label class="lbl">Gebruikersnaam</label>
      <input class="field" data-u autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" value="${esc(sess ? sess.user : "")}" placeholder="bijv. michel">
      <label class="lbl">Wachtwoord</label>
      <input class="field" data-p type="password" autocomplete="${reg ? "new-password" : "current-password"}" placeholder="${reg ? "Minimaal 8 tekens" : ""}">
      ${reg ? `<label class="lbl">Herhaal wachtwoord</label><input class="field" data-p2 type="password" autocomplete="new-password">
      <div class="card" style="margin-top:16px;border-color:rgba(251,191,36,.4)"><p class="small" style="line-height:1.55">⚠️ <b>Onthoud je wachtwoord goed.</b> Omdat alles versleuteld is, kan niemand het resetten. Vergeten = je cloud-kopie is weg (de gegevens op je telefoon blijven wel). Sla het op in je iPhone-wachtwoorden.</p></div>` : ""}
      <p class="small danger-text" data-err style="margin-top:12px;min-height:18px"></p>
      <div style="margin-top:8px"><button class="btn" data-go>${reg ? "Account maken" : "Inloggen"}</button></div>`, {
      onMount(sh, close) {
        const go = $("[data-go]", sh), err = $("[data-err]", sh);
        const fail = msg => { err.textContent = msg; gsap.fromTo(err, { x: -8 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" }); haptic([10, 30, 10]); };
        go.addEventListener("click", async () => {
          const u = normUser($("[data-u]", sh).value), p = $("[data-p]", sh).value;
          if (!/^[a-z0-9_.-]{3,32}$/.test(u)) return fail(ERR.invalid_user);
          if (reg && p.length < 8) return fail("Wachtwoord moet minimaal 8 tekens zijn");
          if (reg && p !== $("[data-p2]", sh).value) return fail("Wachtwoorden zijn niet gelijk");
          if (!p) return fail("Vul je wachtwoord in");
          go.disabled = true; go.textContent = reg ? "Versleutelen…" : "Inloggen…"; err.textContent = "";
          try {
            await (reg ? register(u, p) : login(u, p));
            close(); Sound.success();
            toast(reg ? "Account gemaakt, gegevens veilig opgeslagen 🔒" : "Ingelogd, gegevens gesynchroniseerd ☁️");
            if (done) done();
            if (afterLogin) afterLogin();
          } catch (e) {
            if (e.message === "sync") { close(); toast(ERR.sync); if (done) done(); return; }
            go.disabled = false; go.textContent = reg ? "Account maken" : "Inloggen";
            fail(errText(e));
          }
        });
      }
    });
  }

  function deleteSheet(done) {
    sheet(`
      <h2>Account verwijderen?</h2>
      <p class="sub">Je account en de versleutelde cloud-kopie worden permanent verwijderd. De gegevens op deze telefoon blijven staan.</p>
      <label class="lbl">Bevestig met je wachtwoord</label>
      <input class="field" data-p type="password" autocomplete="current-password">
      <p class="small danger-text" data-err style="margin-top:12px;min-height:18px"></p>
      <button class="btn danger" data-yes>Verwijder mijn account</button>`, {
      onMount(sh, close) {
        $("[data-yes]", sh).addEventListener("click", async e => {
          const b = e.currentTarget; b.disabled = true;
          try { await deleteAccount($("[data-p]", sh).value); close(); toast("Account verwijderd"); done(); }
          catch (err) { b.disabled = false; $("[data-err]", sh).textContent = errText(err); }
        });
      }
    });
  }

  window.Sync = {
    mount, sync, schedule, authSheet, merge, logout,
    get user() { return sess && sess.user; },
    get active() { return !!(sess && !sess.expired); }
  };
})();
