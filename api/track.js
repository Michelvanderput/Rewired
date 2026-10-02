/* App-open tracking for iOS Shortcuts automations.

   GET  /api/track?t=<token>&app=instagram   ← called by the Shortcut when the app opens.
        Logs the open and answers with a short text the Shortcut shows as a notification.
   GET  /api/track?t=<token>                 ← the Routini app fetches the events (last 15 days).
   POST /api/track { t, tz, apps, perOpen }  ← the Routini app stores tz + per-app limits.
   DELETE /api/track { t }                   ← remove everything for this token.

   The token is a long random secret created in the app; it is the only "login" for these endpoints. */
const crypto = require("crypto");
const { redis, json, readBody, kvReady, localNow, allow, DAY, fail } = require("./_lib");
const { TrackConfig, TrackDelete, token, appId } = require("./_schemas");

const MAX_TOKENS = 50;
const KEEP = 3000;
const tokOk = t => token.safeParse(t).success;
const hash = t => crypto.createHash("sha256").update(t).digest("hex").slice(0, 32);
const appOk = a => appId.safeParse(a).success;

const QUESTIONS = [
  "Waarom open je het nu?",
  "Wat zoek je eigenlijk?",
  "Is dit een bewuste keuze?",
  "Verveling, stress of gewoonte?",
  "Wat zou je in plaats hiervan kunnen doen?",
  "Hoe voel je je op dit moment?",
  "Zet een timer: 5 minuten, dan weer weg."
];

function text(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(body);
}

module.exports = async (req, res) => {
  if (!kvReady()) return json(res, 503, { error: "not_configured" });
  try {
    const url = new URL(req.url, "http://x");

    if (req.method === "POST" || req.method === "DELETE") {
      const body = await readBody(req);
      if (!TrackDelete.safeParse(body).success) return json(res, 400, { error: "invalid token" });
      const h = hash(body.t);
      if (req.method === "DELETE") {
        await redis("DEL", "track:cfg:" + h, "track:ev:" + h);
        await redis("SREM", "track:tokens", h);
        return json(res, 200, { ok: true });
      }
      const p = TrackConfig.safeParse(body);
      if (!p.success) return json(res, 400, { error: "invalid tz" });
      const known = await redis("SISMEMBER", "track:tokens", h);
      if (!known && (await redis("SCARD", "track:tokens")) >= MAX_TOKENS) return json(res, 403, { error: "full" });
      await redis("SET", "track:cfg:" + h, JSON.stringify({ tz: p.data.tz, apps: p.data.apps, updated: Date.now() }));
      await redis("SADD", "track:tokens", h);
      return json(res, 200, { ok: true });
    }

    if (req.method !== "GET") return json(res, 405, { error: "method" });
    const t = url.searchParams.get("t");
    if (!tokOk(t)) return text(res, 401, "Routini: ongeldige link. Kopieer hem opnieuw uit de app.");
    const h = hash(t);
    const raw = await redis("GET", "track:cfg:" + h);
    if (!raw) return text(res, 404, "Routini: tracking is niet (meer) ingesteld. Open de app.");
    const cfg = JSON.parse(raw);
    const app = (url.searchParams.get("app") || "").toLowerCase();

    // The Routini app pulls its events
    if (!app) {
      const since = Date.now() - 15 * DAY;
      const ev = ((await redis("LRANGE", "track:ev:" + h, 0, -1)) || []).map(x => JSON.parse(x)).filter(e => e.ts >= since);
      return json(res, 200, { events: ev });
    }

    // Called from the Shortcut
    if (!appOk(app)) return text(res, 400, "Routini: onbekende app-naam in de link.");
    if (!(await allow("trk:" + h, 800, 86400))) return text(res, 429, "Routini: te veel meldingen vandaag.");
    const now = Date.now();
    await redis("RPUSH", "track:ev:" + h, JSON.stringify({ ts: now, app }));
    await redis("LTRIM", "track:ev:" + h, -KEEP, -1);
    const { min } = localNow(cfg.tz, new Date(now));
    const todayStart = now - min * 60000 - new Date(now).getSeconds() * 1000 - new Date(now).getMilliseconds();
    const ev = ((await redis("LRANGE", "track:ev:" + h, -600, -1)) || []).map(x => JSON.parse(x));
    const n = ev.filter(e => e.app === app && e.ts >= todayStart).length;
    const a = cfg.apps[app] || { name: app, e: "📱", limit: 0 };
    const q = QUESTIONS[(n + min) % QUESTIONS.length];
    let msg;
    if (a.limit && n > a.limit) msg = `⛔ ${a.name}: ${n}× vandaag, ${n - a.limit} boven je limiet van ${a.limit}. Leg je telefoon even weg.`;
    else if (a.limit && n === a.limit) msg = `⚠️ ${a.name}: ${n}/${a.limit}. Dit was je laatste keer voor vandaag.`;
    else msg = `${a.e} ${a.name}: ${n}e keer vandaag${a.limit ? ` (limiet ${a.limit})` : ""}. ${q}`;
    if (url.searchParams.get("format") === "json") return json(res, 200, { app, count: n, limit: a.limit, message: msg });
    text(res, 200, msg);
  } catch (e) {
    await fail(res, e, "track");
  }
};
