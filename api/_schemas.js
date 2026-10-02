/* Zod schemas for every request body the API accepts.
   Hard requirements (token, keys, subscription) fail the request; optional extras that are malformed
   fall back to a safe default (.catch), so an older app version never gets locked out. */
// @ts-check
const { z } = require("zod");
const { validSubscription, validTime, validTz, validUser, b64ok } = require("./_lib");

const tz = z.string().max(64).refine(validTz);
const b64 = (/** @type {number} */ bytes) => z.string().max(128).refine(s => b64ok(s, bytes));
const user = z.string().max(64).transform(s => s.trim().toLowerCase()).refine(validUser);
const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/* ---------- /api/subscribe ---------- */
const REMINDER_IDS = /** @type {const} */ (["morning", "midday", "evening", "night", "risk0", "risk1", "risk2"]);
const reminder = z.object({ on: z.unknown(), time: z.string().refine(validTime) }).transform(r => ({ on: !!r.on, time: r.time }));

const Subscribe = z.object({
  subscription: z.object({
    endpoint: z.string().max(2048),
    keys: z.object({ p256dh: z.string().max(256), auth: z.string().max(256) })
  }).refine(validSubscription),
  tz,
  // keep only known ids with a valid time; anything else is silently dropped
  reminders: z.record(z.string(), z.unknown()).catch({}).optional().transform(r => {
    /** @type {Record<string, { on: boolean, time: string }>} */
    const clean = {};
    for (const id of REMINDER_IDS) {
      const p = reminder.safeParse(r && r[id]);
      if (p.success) clean[id] = p.data;
    }
    return clean;
  }),
  startDate: z.number().finite().positive().refine(n => n <= Date.now()).nullable().catch(null).optional().transform(v => v ?? null),
  name: z.string().transform(s => s.slice(0, 40)).catch("").optional().transform(v => v ?? ""),
  // labels for the personal risk-moment reminders (risk0..risk2), computed on the phone from the urge log
  risks: z.array(z.unknown()).catch([]).optional().transform(list => (list || []).slice(0, 3).map(r => {
    const p = z.object({ label: z.string(), detail: z.string().catch(""), tip: z.string().catch("") }).safeParse(r);
    return p.success ? { label: p.data.label.slice(0, 20), detail: p.data.detail.slice(0, 80), tip: p.data.tip.slice(0, 120) } : null;
  })),
  recaps: z.array(z.unknown()).catch([]).optional().transform(list => (list || []).slice(0, 2).flatMap(r => {
    const p = z.object({ day, title: z.string(), body: z.string() }).safeParse(r);
    return p.success ? [{ day: p.data.day, title: p.data.title.slice(0, 80), body: p.data.body.slice(0, 160) }] : [];
  }))
});
const Unsubscribe = z.object({ endpoint: z.string().min(1).max(2048) });

/* ---------- /api/track ---------- */
const token = z.string().regex(/^[A-Za-z0-9_-]{24,64}$/);
const appId = z.string().regex(/^[a-z0-9_-]{1,24}$/);
const TrackDelete = z.object({ t: token });
const TrackConfig = z.object({
  t: token,
  tz,
  apps: z.record(z.string(), z.unknown()).catch({}).optional().transform(apps => {
    /** @type {Record<string, { name: string, e: string, limit: number }>} */
    const out = {};
    Object.entries(apps || {}).slice(0, 20).forEach(([id, raw]) => {
      if (!appId.safeParse(id).success || !raw || typeof raw !== "object") return;
      const a = /** @type {{ name?: unknown, e?: unknown, limit?: unknown }} */ (raw);
      out[id] = { name: String(a.name || id).slice(0, 30), e: String(a.e || "📱").slice(0, 4), limit: Math.max(0, Math.min(500, parseInt(String(a.limit), 10) || 0)) };
    });
    return out;
  })
});

/* ---------- /api/auth ---------- */
const Salt = z.object({ action: z.literal("salt"), user });
const Register = z.object({ action: z.literal("register"), user, salt: b64(16), authKey: b64(32) });
const Login = z.object({ action: z.literal("login"), user, authKey: b64(32) });
const DeleteAccount = z.object({ action: z.literal("delete"), authKey: b64(32) });

/* ---------- /api/data ---------- */
const MAX_BLOB = 900 * 1024;
const DataPut = z.object({
  blob: z.object({ iv: z.string().max(64), ct: z.string().max(MAX_BLOB) }),
  baseRev: z.number().int().nonnegative().nullable().optional().transform(v => v || 0)
});

module.exports = { Subscribe, Unsubscribe, TrackDelete, TrackConfig, appId, token, Salt, Register, Login, DeleteAccount, DataPut, MAX_BLOB };
