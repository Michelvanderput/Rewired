/* POST /api/subscribe   { subscription, tz, reminders, startDate, name } → store/update
   DELETE /api/subscribe { endpoint } → remove */
const { config, json, readBody, saveSub, getSub, deleteSubKey, redis, fail } = require("./_lib");
const { Subscribe, Unsubscribe } = require("./_schemas");

const MAX_SUBS = 50;

module.exports = async (req, res) => {
  const missing = config();
  if (missing.length) return json(res, 503, { error: "not_configured", missing });
  try {
    const body = await readBody(req);

    if (req.method === "DELETE") {
      const p = Unsubscribe.safeParse(body);
      if (!p.success) return json(res, 400, { error: "endpoint required" });
      const crypto = require("crypto");
      await deleteSubKey("sub:" + crypto.createHash("sha256").update(p.data.endpoint).digest("hex").slice(0, 32));
      return json(res, 200, { ok: true });
    }
    if (req.method !== "POST") return json(res, 405, { error: "method" });

    const p = Subscribe.safeParse(body);
    if (!p.success) return json(res, 400, { error: p.error.issues.some(i => i.path[0] === "subscription") ? "invalid subscription" : "invalid tz" });
    const { subscription, tz, reminders, startDate, name, recaps } = p.data;

    const existing = await getSub(subscription.endpoint);
    if (!existing && (await redis("SCARD", "subs")) >= MAX_SUBS) return json(res, 429, { error: "too many subscriptions" });

    await saveSub({
      subscription: { endpoint: subscription.endpoint, keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth } },
      tz,
      reminders,
      startDate,
      name,
      recaps,
      lastSent: existing ? existing.lastSent || {} : {},
      updated: Date.now()
    });
    json(res, 200, { ok: true });
  } catch (e) {
    await fail(res, e, "subscribe");
  }
};
