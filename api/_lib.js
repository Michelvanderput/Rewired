/* Shared helpers for the push API: Redis (Upstash REST), web-push setup, messages */
const crypto = require("crypto");
const webpush = require("web-push");

const DAY = 86400000;

/* ---------- storage: Upstash Redis over REST (no client library needed) ---------- */
const KV_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...cmd) {
  const r = await fetch(KV_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${KV_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd)
  });
  const j = await r.json();
  if (j.error) throw new Error("redis: " + j.error);
  return j.result;
}

const subKey = endpoint => "sub:" + crypto.createHash("sha256").update(endpoint).digest("hex").slice(0, 32);

async function saveSub(rec) {
  const key = subKey(rec.subscription.endpoint);
  await redis("SET", key, JSON.stringify(rec));
  await redis("SADD", "subs", key);
  return key;
}
async function getSub(endpoint) {
  const raw = await redis("GET", subKey(endpoint));
  return raw ? JSON.parse(raw) : null;
}
async function deleteSubKey(key) {
  await redis("DEL", key);
  await redis("SREM", "subs", key);
}
async function allSubs() {
  const keys = (await redis("SMEMBERS", "subs")) || [];
  if (!keys.length) return [];
  const vals = await redis("MGET", ...keys);
  return keys.map((k, i) => ({ key: k, rec: vals[i] ? JSON.parse(vals[i]) : null }));
}

/* ---------- config ---------- */
function config() {
  const missing = [];
  if (!KV_URL || !KV_TOKEN) missing.push("Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN)");
  if (!process.env.VAPID_PUBLIC_KEY) missing.push("VAPID_PUBLIC_KEY");
  if (!process.env.VAPID_PRIVATE_KEY) missing.push("VAPID_PRIVATE_KEY");
  if (!missing.length) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:rewired@example.com",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
  }
  return missing;
}

/* ---------- validation ---------- */
const PUSH_HOSTS = /(^|\.)(push\.apple\.com|googleapis\.com|push\.services\.mozilla\.com|notify\.windows\.com|push\.api\.chrome\.google\.com)$/;
function validSubscription(s) {
  try {
    const u = new URL(s.endpoint);
    return u.protocol === "https:" && PUSH_HOSTS.test(u.hostname) && s.keys && typeof s.keys.p256dh === "string" && typeof s.keys.auth === "string";
  } catch (e) { return false; }
}
const validTime = t => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t);
function validTz(tz) {
  try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch (e) { return false; }
}

/* ---------- time in the user's timezone ---------- */
function localNow(tz, date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date).map(p => [p.type, p.value]));
  return { day: `${parts.year}-${parts.month}-${parts.day}`, min: (+parts.hour % 24) * 60 + +parts.minute };
}
const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

/* ---------- messages ---------- */
const MILESTONES = { 1: "Dag 1", 3: "3 dagen", 7: "1 week", 14: "2 weken", 30: "30 dagen", 60: "60 dagen", 90: "90 dagen", 180: "180 dagen", 365: "1 jaar" };
const QUOTES = [
  "Wie zichzelf overwint is machtig. — Lao Tzu",
  "Je hoeft niet perfect te zijn. Je moet alleen vandaag winnen.",
  "Het brein verandert door wat je herhaalt.",
  "Elke keer dat je nee zegt, wordt het pad makkelijker.",
  "Een drang is een golf. Wacht tot hij breekt.",
  "De pijn van discipline weegt minder dan de pijn van spijt. — Jim Rohn",
  "Val zeven keer, sta acht keer op.",
  "Beheers jezelf, of iets anders zal jou beheersen."
];
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

function message(id, rec, now = Date.now()) {
  const days = rec.startDate ? Math.max(0, Math.floor((now - rec.startDate) / DAY)) : null;
  const dayTxt = days == null ? "" : days === 1 ? "1 dag" : `${days} dagen`;
  const name = rec.name ? `, ${rec.name}` : "";
  const seed = Math.floor(now / DAY);

  if (id === "morning") {
    const yday = rec.tz ? localNow(rec.tz, new Date(now - DAY)).day : null;
    const recap = (rec.recaps || []).find(r => r.day === yday);
    if (recap) {
      const milestone = days && MILESTONES[days] ? `🏆 ${MILESTONES[days]} vrij! · ` : "";
      return { title: `☀️ ${milestone}${recap.title}`, body: `${recap.body} · Tik voor je recap en tips`, url: "./?open=recap", tag: "morning" };
    }
    if (days && MILESTONES[days]) {
      return { title: `🏆 ${MILESTONES[days]} vrij!`, body: `Mijlpaal bereikt${name}. Je brein verandert echt. Open de app om het te vieren.`, url: "./?open=home", tag: "milestone" };
    }
    return {
      title: days != null ? `Dag ${days} 🔥` : "Goedemorgen 🔥",
      body: pick([
        `Goedemorgen${name}. Start sterk: koude douche, daglicht en je Dopamine Reset.`,
        `Nieuwe dag, nieuwe overwinning${name}. Eerste uur geen social media.`,
        `Goedemorgen${name}. ${dayTxt ? dayTxt + " vrij. " : ""}Bouw vandaag verder.`
      ], seed),
      url: "./?open=home", tag: "morning"
    };
  }
  if (id === "midday") {
    return { title: "Gedachte van de dag", body: pick(QUOTES, seed), url: "./?open=home", tag: "midday" };
  }
  if (id === "evening") {
    return { title: "Tijd voor je check-in ✍️", body: `Hoe was je dag${name}? 30 seconden om je stemming te loggen.`, url: "./?open=checkin", tag: "evening" };
  }
  if (id === "night") {
    return {
      title: "Telefoon weg 🌙",
      body: pick([
        `Dit is je risicomoment. Leg je telefoon buiten de slaapkamer${dayTxt ? ". Je staat op " + dayTxt : ""}.`,
        `Moe + alleen + scherm = gevaar. Nu slapen${name}. Morgen ben je trots.`,
        `Voel je een drang? Open de noodmodus. Anders: welterusten${name}.`
      ], seed),
      url: "./?open=home", tag: "night"
    };
  }
  return { title: "Rewired", body: "Test gelukt! Je meldingen werken. 💪", url: "./", tag: "test" };
}

async function send(rec, payload) {
  return webpush.sendNotification(rec.subscription, JSON.stringify(payload), { TTL: 60 * 60 * 4, urgency: "normal" });
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

async function readBody(req, max = 20000) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");
  let data = "";
  for await (const c of req) { data += c; if (data.length > max) throw new Error("too large"); }
  return JSON.parse(data || "{}");
}

/* ---------- accounts ---------- */
const sha256 = s => crypto.createHash("sha256").update(s).digest("hex");
const validUser = u => typeof u === "string" && /^[a-z0-9_.-]{3,32}$/.test(u);
const b64ok = (s, bytes) => typeof s === "string" && /^[A-Za-z0-9_-]+$/.test(s) && Buffer.from(s, "base64url").length === bytes;
const kvReady = () => !!(KV_URL && KV_TOKEN);

/* Returns the username for "Authorization: Bearer <token>", or null */
async function sessionUser(req) {
  const m = /^Bearer ([A-Za-z0-9_-]{20,})$/.exec(req.headers.authorization || "");
  if (!m) return null;
  return (await redis("GET", "session:" + sha256(m[1]))) || null;
}

/* Fixed-window rate limit: true when the caller is still allowed */
async function allow(key, max, seconds) {
  const n = await redis("INCR", "rl:" + key);
  if (n === 1) await redis("EXPIRE", "rl:" + key, seconds);
  return n <= max;
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "?").split(",")[0].trim();
}

module.exports = { redis, saveSub, getSub, deleteSubKey, allSubs, config, validSubscription, validTime, validTz, localNow, toMin, message, send, json, readBody, DAY, sha256, validUser, b64ok, kvReady, sessionUser, allow, clientIp };
