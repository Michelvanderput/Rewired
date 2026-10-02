/* Local stand-in for Vercel, used by the end-to-end tests:
   - serves the static app with the headers from vercel.json (so the CSP is tested as deployed)
   - runs the api/ functions
   - fake Upstash Redis (REST) in memory
   - captures web-push messages and decrypts them, so tests can read what would be sent

   Test-only endpoints: /__sent (pushes), /__db (redis contents), /__fakesub (a subscription the tests can use). */
const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "../..");
const PORT = +process.env.PORT || 8800;
const REDIS_PORT = PORT + 1;

/* ---------- fake Upstash Redis ---------- */
const db = new Map(), sets = new Map(), lists = new Map();
const S = k => sets.get(k) || (sets.set(k, new Set()), sets.get(k));
const range = (L, a, b) => { const n = L.length, s = +a < 0 ? Math.max(0, n + +a) : +a, e = +b < 0 ? n + +b : +b; return [s, e]; };
function redisCommand([cmd, ...a]) {
  switch (cmd) {
    case "SET": if (a.includes("NX") && db.has(a[0])) return null; db.set(a[0], a[1]); return "OK";
    case "GET": return db.get(a[0]) ?? null;
    case "DEL": return a.filter(k => db.delete(k) | lists.delete(k)).length;
    case "INCR": { const v = (+db.get(a[0]) || 0) + 1; db.set(a[0], String(v)); return v; }
    case "EXPIRE": return 1;
    case "SADD": S(a[0]).add(a[1]); return 1;
    case "SREM": S(a[0]).delete(a[1]); return 1;
    case "SMEMBERS": return [...S(a[0])];
    case "SCARD": return S(a[0]).size;
    case "SISMEMBER": return S(a[0]).has(a[1]) ? 1 : 0;
    case "MGET": return a.map(k => db.get(k) ?? null);
    case "RPUSH": { const L = lists.get(a[0]) || []; L.push(...a.slice(1)); lists.set(a[0], L); return L.length; }
    case "LTRIM": { const L = lists.get(a[0]) || []; const [s, e] = range(L, a[1], a[2]); lists.set(a[0], L.slice(s, e + 1)); return "OK"; }
    case "LRANGE": { const L = lists.get(a[0]) || []; const [s, e] = range(L, a[1], a[2]); return L.slice(s, e + 1); }
    default: throw new Error("unknown command " + cmd);
  }
}
http.createServer((req, res) => {
  let b = ""; req.on("data", c => (b += c)); req.on("end", () => {
    if (req.headers.authorization !== "Bearer testtoken") return res.end(JSON.stringify({ error: "auth" }));
    try { res.end(JSON.stringify({ result: redisCommand(JSON.parse(b)) })); }
    catch (e) { res.end(JSON.stringify({ error: e.message })); }
  });
}).listen(REDIS_PORT);

/* ---------- environment like on Vercel ---------- */
const webpush = require(ROOT + "/node_modules/web-push");
const ece = require(ROOT + "/node_modules/http_ece");
const keys = webpush.generateVAPIDKeys();
Object.assign(process.env, {
  KV_REST_API_URL: `http://localhost:${REDIS_PORT}`, KV_REST_API_TOKEN: "testtoken",
  VAPID_PUBLIC_KEY: keys.publicKey, VAPID_PRIVATE_KEY: keys.privateKey, VAPID_SUBJECT: "mailto:test@example.com",
  CRON_SECRET: "cronsecret",
  SENTRY_DSN: "https://publickey@o1.ingest.de.sentry.io/42"
});

/* server-side Sentry reports are captured instead of sent */
const sentry = [];
const realFetch = globalThis.fetch;
globalThis.fetch = (url, opts) => {
  if (String(url).includes(".ingest.")) { sentry.push({ url: String(url), headers: opts.headers, body: opts.body }); return Promise.resolve(new Response("{}")); }
  return realFetch(url, opts);
};

/* ---------- a subscription whose keys we own, so pushes can be decrypted ---------- */
const ecdh = crypto.createECDH("prime256v1"); ecdh.generateKeys();
const auth = crypto.randomBytes(16);
const FAKE_SUB = { endpoint: "https://web.push.apple.com/QFAKE-" + Date.now(), keys: { p256dh: ecdh.getPublicKey().toString("base64url"), auth: auth.toString("base64url") } };

const sent = [];
webpush.sendNotification = async (sub, payload, opts) => {
  const d = webpush.generateRequestDetails(sub, payload, opts);
  if (!d.headers.Authorization.startsWith("vapid t=")) throw new Error("missing VAPID header");
  const msg = JSON.parse(ece.decrypt(d.body, { version: "aes128gcm", privateKey: ecdh, authSecret: auth.toString("base64url") }).toString());
  if (sub.endpoint.includes("GONE")) { const e = new Error("gone"); e.statusCode = 410; throw e; }
  sent.push({ endpoint: sub.endpoint, ttl: d.headers.TTL, msg });
  return { statusCode: 201 };
};

/* ---------- headers from vercel.json ---------- */
const vercel = JSON.parse(fs.readFileSync(ROOT + "/vercel.json", "utf8"));
const headerRules = (vercel.headers || []).map(r => ({ re: new RegExp("^" + r.source.replace(/\(\.\*\)/g, "(.*)") + "$"), headers: r.headers }));
function applyHeaders(res, pathname) {
  headerRules.forEach(r => { if (r.re.test(pathname)) r.headers.forEach(h => res.setHeader(h.key, h.value)); });
}

/* ---------- static files + api ---------- */
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "application/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png", ".svg": "image/svg+xml" };
http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  applyHeaders(res, u.pathname);
  if (u.pathname === "/__sent") return res.end(JSON.stringify(sent));
  if (u.pathname === "/__db") return res.end(JSON.stringify(Object.fromEntries(db)));
  if (u.pathname === "/__sentry") return res.end(JSON.stringify(sentry));
  if (u.pathname === "/__fakesub") return res.end(JSON.stringify(FAKE_SUB));
  if (u.pathname.startsWith("/api/")) {
    const name = u.pathname.slice(5).replace(/[^a-z]/g, "");
    const file = path.join(ROOT, "api", name + ".js");
    if (!fs.existsSync(file)) { res.statusCode = 404; return res.end("not found"); }
    let b = ""; for await (const c of req) b += c;
    try { req.body = b ? JSON.parse(b) : {}; } catch { req.body = b; }
    return require(file)(req, res);
  }
  let f = path.join(ROOT, decodeURIComponent(u.pathname));
  if (f.endsWith("/")) f += "index.html";
  const blocked = !f.startsWith(ROOT) || /node_modules|[/\\]api[/\\]|[/\\]tests[/\\]|[/\\]\.git/.test(f);
  if (blocked || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end("not found"); }
  res.setHeader("Content-Type", TYPES[path.extname(f)] || "application/octet-stream");
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log(`test server on http://localhost:${PORT}`));
