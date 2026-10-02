/* POST /api/auth  { action, ... }
   The password never reaches this server. The app derives two keys from it (PBKDF2):
   an "authKey" that is sent here and an encryption key that stays on the phone.
   Here the authKey is hashed again with scrypt before it is stored.

   actions:
     salt     { user }                   → { salt }   (fake but stable salt for unknown users)
     register { user, salt, authKey }    → { token }
     login    { user, authKey }          → { token }
     logout                              (Bearer token)
     delete   { authKey }                (Bearer token) removes account + data + sessions
*/
const crypto = require("crypto");
const { redis, json, readBody, kvReady, sha256, sessionUser, allow, clientIp, fail } = require("./_lib");
const { Salt, Register, Login, DeleteAccount } = require("./_schemas");

const SESSION_TTL = 60 * 60 * 24 * 180; // 180 days
const MAX_USERS = +process.env.MAX_USERS || 25;
const SECRET = process.env.AUTH_SECRET || process.env.CRON_SECRET || process.env.VAPID_PRIVATE_KEY || "rewired";

const scrypt = (key, salt) => new Promise((ok, no) =>
  crypto.scrypt(Buffer.from(key, "base64url"), Buffer.from(salt, "base64url"), 32, { N: 16384, r: 8, p: 1 }, (e, k) => e ? no(e) : ok(k)));

async function newSession(user) {
  const token = crypto.randomBytes(32).toString("base64url");
  await redis("SET", "session:" + sha256(token), user, "EX", SESSION_TTL);
  await redis("SADD", "sessions:" + user, sha256(token));
  return token;
}

async function getUser(user) {
  const raw = await redis("GET", "user:" + user);
  return raw ? JSON.parse(raw) : null;
}

async function verify(rec, authKey) {
  const h = await scrypt(authKey, rec.hsalt);
  return crypto.timingSafeEqual(h, Buffer.from(rec.hash, "base64url"));
}

module.exports = async (req, res) => {
  if (!kvReady()) return json(res, 503, { error: "not_configured" });
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  try {
    const body = await readBody(req);
    const ip = clientIp(req);

    if (body.action === "salt") {
      const p = Salt.safeParse(body);
      if (!p.success) return json(res, 400, { error: "invalid_user" });
      const { user } = p.data;
      const rec = await getUser(user);
      const salt = rec ? rec.salt : crypto.createHmac("sha256", SECRET).update("salt:" + user).digest().subarray(0, 16).toString("base64url");
      return json(res, 200, { salt });
    }

    if (body.action === "register") {
      const p = Register.safeParse(body);
      if (!p.success) return json(res, 400, { error: p.error.issues.some(i => i.path[0] === "user") ? "invalid_user" : "invalid_key" });
      const { user } = p.data;
      if (!(await allow("reg:" + ip, 5, 3600))) return json(res, 429, { error: "rate_limited" });
      if ((await redis("SCARD", "users")) >= MAX_USERS) return json(res, 403, { error: "full" });
      const hsalt = crypto.randomBytes(16).toString("base64url");
      const rec = { salt: body.salt, hsalt, hash: (await scrypt(body.authKey, hsalt)).toString("base64url"), created: Date.now() };
      // NX: only create when the name is still free
      const ok = await redis("SET", "user:" + user, JSON.stringify(rec), "NX");
      if (ok !== "OK") return json(res, 409, { error: "user_exists" });
      await redis("SADD", "users", user);
      return json(res, 200, { token: await newSession(user), user });
    }

    if (body.action === "login") {
      const p = Login.safeParse(body);
      if (!p.success) return json(res, 400, { error: "invalid" });
      const { user } = p.data;
      if (!(await allow("login:" + user, 10, 900)) || !(await allow("loginip:" + ip, 30, 900))) return json(res, 429, { error: "rate_limited" });
      const rec = await getUser(user);
      if (!rec || !(await verify(rec, body.authKey))) return json(res, 401, { error: "wrong_credentials" });
      return json(res, 200, { token: await newSession(user), user });
    }

    const me = await sessionUser(req);
    if (!me) return json(res, 401, { error: "unauthorized" });

    if (body.action === "logout") {
      const token = (req.headers.authorization || "").slice(7);
      await redis("DEL", "session:" + sha256(token));
      await redis("SREM", "sessions:" + me, sha256(token));
      return json(res, 200, { ok: true });
    }

    if (body.action === "delete") {
      const rec = await getUser(me);
      if (!rec || !DeleteAccount.safeParse(body).success || !(await verify(rec, body.authKey))) return json(res, 401, { error: "wrong_credentials" });
      const sessions = (await redis("SMEMBERS", "sessions:" + me)) || [];
      for (const s of sessions) await redis("DEL", "session:" + s);
      await redis("DEL", "sessions:" + me, "user:" + me, "data:" + me);
      await redis("SREM", "users", me);
      return json(res, 200, { ok: true });
    }

    json(res, 400, { error: "unknown_action" });
  } catch (e) {
    await fail(res, e, "auth");
  }
};
