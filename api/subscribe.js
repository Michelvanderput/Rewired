/* POST /api/subscribe   { subscription, tz, reminders, startDate, name } → store/update
   DELETE /api/subscribe { endpoint } → remove */
const { config, json, readBody, saveSub, getSub, deleteSubKey, redis, validSubscription, validTime, validTz } = require("./_lib");

const REMINDER_IDS = ["morning", "midday", "evening", "night"];
const MAX_SUBS = 50;

module.exports = async (req, res) => {
  const missing = config();
  if (missing.length) return json(res, 503, { error: "not_configured", missing });
  try {
    const body = await readBody(req);

    if (req.method === "DELETE") {
      if (!body.endpoint) return json(res, 400, { error: "endpoint required" });
      const crypto = require("crypto");
      await deleteSubKey("sub:" + crypto.createHash("sha256").update(body.endpoint).digest("hex").slice(0, 32));
      return json(res, 200, { ok: true });
    }
    if (req.method !== "POST") return json(res, 405, { error: "method" });

    const { subscription, tz, reminders, startDate, name, recaps } = body;
    if (!validSubscription(subscription)) return json(res, 400, { error: "invalid subscription" });
    if (!validTz(tz)) return json(res, 400, { error: "invalid tz" });

    const clean = {};
    for (const id of REMINDER_IDS) {
      const r = reminders && reminders[id];
      if (r && validTime(r.time)) clean[id] = { on: !!r.on, time: r.time };
    }

    const existing = await getSub(subscription.endpoint);
    if (!existing && (await redis("SCARD", "subs")) >= MAX_SUBS) return json(res, 429, { error: "too many subscriptions" });

    await saveSub({
      subscription: { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
      tz,
      reminders: clean,
      startDate: Number.isFinite(startDate) && startDate > 0 && startDate <= Date.now() ? startDate : null,
      name: typeof name === "string" ? name.slice(0, 40) : "",
      recaps: Array.isArray(recaps) ? recaps.slice(0, 2).filter(r => r && /^\d{4}-\d{2}-\d{2}$/.test(r.day) && typeof r.title === "string" && typeof r.body === "string")
        .map(r => ({ day: r.day, title: r.title.slice(0, 80), body: r.body.slice(0, 160) })) : [],
      lastSent: existing ? existing.lastSent || {} : {},
      updated: Date.now()
    });
    json(res, 200, { ok: true });
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
};
