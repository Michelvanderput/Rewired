// Server API without a browser: auth, encrypted data, tracking, push subscriptions, cron
const { test, expect } = require("@playwright/test");
const crypto = require("crypto");
const { getJSON } = require("../support/helpers");

const rnd = n => crypto.randomBytes(n).toString("base64url");
const json = (method, body, headers = {}) => ({ method, headers: { "Content-Type": "application/json", ...headers }, data: body });

test("auth + data: hashing, sessions, conflicts, rate limit", async ({ request }) => {
  const user = "api" + Date.now().toString(36), salt = rnd(16), authKey = rnd(32);
  const reg = await request.post("/api/auth", json("POST", { action: "register", user, salt, authKey }));
  expect(reg.status()).toBe(200);
  expect((await request.post("/api/auth", json("POST", { action: "register", user, salt, authKey }))).status()).toBe(409);
  expect((await (await request.post("/api/auth", json("POST", { action: "salt", user }))).json()).salt).toBe(salt);
  const fake1 = await (await request.post("/api/auth", json("POST", { action: "salt", user: "bestaatniet" }))).json();
  const fake2 = await (await request.post("/api/auth", json("POST", { action: "salt", user: "bestaatniet" }))).json();
  expect(fake1.salt).toBe(fake2.salt); // stable fake salt: no user enumeration
  expect((await request.post("/api/auth", json("POST", { action: "login", user, authKey: rnd(32) }))).status()).toBe(401);
  const { token } = await (await request.post("/api/auth", json("POST", { action: "login", user, authKey }))).json();
  const auth = { Authorization: "Bearer " + token };

  expect((await (await request.get("/api/data", { headers: auth })).json())).toMatchObject({ rev: 0, blob: null });
  expect((await request.put("/api/data", json("PUT", { blob: { iv: "aaa", ct: "bbb" }, baseRev: 0 }, auth))).status()).toBe(200);
  expect((await request.put("/api/data", json("PUT", { blob: { iv: "aaa", ct: "ccc" }, baseRev: 0 }, auth))).status()).toBe(409);
  expect((await request.put("/api/data", json("PUT", { blob: { iv: 1 }, baseRev: 1 }, auth))).status()).toBe(400);
  expect((await request.get("/api/data")).status()).toBe(401);

  await request.post("/api/auth", json("POST", { action: "logout" }, auth));
  expect((await request.get("/api/data", { headers: auth })).status()).toBe(401);
  let last = 0;
  for (let i = 0; i < 11; i++) last = (await request.post("/api/auth", json("POST", { action: "login", user, authKey }))).status();
  expect(last).toBe(429);
});

test("track: config, messages, limits, invalid input", async ({ request }) => {
  const t = rnd(24);
  expect((await request.post("/api/track", json("POST", { t, tz: "Europe/Amsterdam", apps: { instagram: { name: "Instagram", e: "📸", limit: 2 } } }))).status()).toBe(200);
  const texts = [];
  for (let i = 0; i < 3; i++) texts.push(await (await request.get(`/api/track?t=${t}&app=instagram`)).text());
  expect(texts[0]).toMatch(/^📸 Instagram: 1e keer vandaag \(limiet 2\)/);
  expect(texts[1]).toMatch(/^⚠️ Instagram: 2\/2/);
  expect(texts[2]).toMatch(/^⛔ Instagram: 3× vandaag/);
  expect((await (await request.get(`/api/track?t=${t}`)).json()).events).toHaveLength(3);
  expect((await request.get(`/api/track?t=${t}&app=../etc`)).status()).toBe(400);
  expect((await request.post("/api/track", json("POST", { t: "kort", tz: "Europe/Amsterdam" }))).status()).toBe(400);
  expect((await request.post("/api/track", json("POST", { t, tz: "Mars/Base" }))).status()).toBe(400);
  await request.delete("/api/track", json("DELETE", { t }));
  expect((await request.get(`/api/track?t=${t}&app=instagram`)).status()).toBe(404);
});

test("subscribe + cron: validation, due reminders, expired subscriptions", async ({ request }) => {
  const FAKE = await getJSON("/__fakesub");
  const now = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date());
  expect((await request.post("/api/subscribe", json("POST", { subscription: { ...FAKE, endpoint: "https://evil.example.com/x" }, tz: "Europe/Amsterdam" }))).status()).toBe(400);
  expect((await request.post("/api/subscribe", json("POST", { subscription: FAKE, tz: "Mars/Base" }))).status()).toBe(400);
  expect((await request.post("/api/subscribe", json("POST", { subscription: FAKE, tz: "Europe/Amsterdam", reminders: { evening: { on: true, time: now } }, startDate: Date.now() - 3 * 864e5, name: "Michel" }))).status()).toBe(200);
  expect((await request.post("/api/subscribe", json("POST", { subscription: { ...FAKE, endpoint: "https://web.push.apple.com/GONE" }, tz: "Europe/Amsterdam", reminders: { evening: { on: true, time: now } } }))).status()).toBe(200);
  expect((await request.get("/api/cron")).status()).toBe(401);
  const r1 = await (await request.get("/api/cron?key=cronsecret")).json();
  const r2 = await (await request.get("/api/cron", { headers: { Authorization: "Bearer cronsecret" } })).json();
  expect(r1).toMatchObject({ sent: 1, removed: 1 });
  expect(r2.sent).toBe(0);
  // a run that is still busy blocks a second one (no double reminders when two crons overlap)
  const kv = cmd => fetch("http://localhost:8801", { method: "POST", headers: { Authorization: "Bearer testtoken" }, body: JSON.stringify(cmd) });
  await kv(["SET", "cron:lock", "1"]);
  expect(await (await request.get("/api/cron?key=cronsecret")).json()).toEqual({ skipped: "already running" });
  await kv(["DEL", "cron:lock"]);
  expect((await (await request.get("/api/cron?key=cronsecret")).json()).subs).toBe(1);
  const sent = await getJSON("/__sent");
  expect(sent.at(-1).msg.title).toBe("Tijd voor je check-in ✍️");
  await request.delete("/api/subscribe", json("DELETE", { endpoint: FAKE.endpoint }));
});
