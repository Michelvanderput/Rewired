/* Opt-in crash reporting to Sentry.
   Off unless the server has a DSN (/api/config) AND the user switched on "Foutmeldingen delen" in Profiel.
   Only the error type, a scrubbed message, the stack (script file names + line numbers), app version and
   browser are sent: never journal text, names, habits or anything else from Store. At most 5 per session. */
(function () {
  const VERSION = "routini-v16";
  let target = null, sent = 0;
  const on = () => !!(target && window.Store && Store.s.settings && Store.s.settings.errors === true);

  function parse(dsn) {
    try {
      const u = new URL(dsn), project = u.pathname.replace(/\//g, "");
      if (!u.username || !/^\d+$/.test(project)) return null;
      return { url: `${u.protocol}//${u.host}/api/${project}/envelope/?sentry_key=${u.username}&sentry_version=7&sentry_client=routini-web/1.0`, dsn: `${u.protocol}//${u.username}@${u.host}/${project}` };
    } catch { return null; }
  }

  // quoted fragments in messages can contain user input (e.g. a JSON parse error), so they are blanked
  const scrub = s => String(s || "").replace(/(["'`])(?:(?!\1).){1,}\1/g, "$1…$1").replace(/https?:\/\/[^\s)]+/g, u => u.split(/[?#]/)[0]).slice(0, 300);

  function frames(stack) {
    return String(stack || "").split("\n").map(l => {
      const m = l.match(/(?:at |@)(?:([^\s(@]+) \(|([^\s(@]*)@)?\(?(https?:\/\/[^\s)]+?):(\d+):(\d+)\)?$/);
      return m ? { filename: m[3].split(/[?#]/)[0].replace(location.origin, ""), function: m[1] || m[2] || "?", lineno: +m[4], colno: +m[5], in_app: !/vendor/.test(m[3]) } : null;
    }).filter(Boolean).slice(0, 30).reverse();
  }

  function capture(type, value, stack) {
    if (!on() || sent >= 5) return;
    sent++;
    const id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now()).replace(/-/g, "").slice(0, 32).padEnd(32, "0");
    const event = {
      event_id: id, timestamp: Date.now() / 1000, platform: "javascript", level: "error", release: VERSION,
      environment: location.hostname === "localhost" ? "development" : "production",
      tags: { standalone: String(!!(navigator.standalone || matchMedia("(display-mode: standalone)").matches)) },
      request: { url: location.origin + location.pathname, headers: { "User-Agent": navigator.userAgent } },
      exception: { values: [{ type: scrub(type) || "Error", value: scrub(value), stacktrace: { frames: frames(stack) } }] }
    };
    const body = [JSON.stringify({ event_id: id, dsn: target.dsn, sent_at: new Date().toISOString() }), JSON.stringify({ type: "event" }), JSON.stringify(event)].join("\n");
    fetch(target.url, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain;charset=UTF-8" } }).catch(() => {});
  }

  addEventListener("error", e => { if (e.error || e.message) capture(e.error && e.error.name, e.error && e.error.message || e.message, e.error && e.error.stack); });
  addEventListener("unhandledrejection", e => {
    const r = e.reason;
    capture(r && r.name || "UnhandledRejection", r && r.message || String(r), r && r.stack);
  });

  const ready = fetch("/api/config").then(r => r.ok ? r.json() : {}).then(c => { target = c.sentryDsn ? parse(c.sentryDsn) : null; }).catch(() => {});

  window.Monitor = { available: () => !!target, ready, capture: e => capture(e && e.name, e && e.message, e && e.stack), _scrub: scrub };
})();
