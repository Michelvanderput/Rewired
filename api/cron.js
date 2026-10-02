/* GET /api/cron → send every reminder that is due.
   Call it every 5–15 minutes (cron-job.org) and/or via the daily Vercel cron.
   Auth: "Authorization: Bearer <CRON_SECRET>" (Vercel cron sends this) or ?key=<CRON_SECRET>. */
const { redis, config, json, fail, allSubs, saveSub, deleteSubKey, localNow, toMin, message, send } = require("./_lib");

// A reminder is still sent when the cron runs up to this many minutes late
const WINDOW = 90;

function due(rec, now) {
  const { day, min } = localNow(rec.tz, now);
  const out = [];
  for (const [id, r] of Object.entries(rec.reminders || {})) {
    if (!r.on) continue;
    const t = toMin(r.time);
    const late = (min - t + 1440) % 1440; // handles windows that cross midnight
    const sentFor = (rec.lastSent || {})[id];
    // the "day" a reminder belongs to: if we are past midnight but inside the window of yesterday's slot
    const slotDay = min < t ? localNow(rec.tz, new Date(now.getTime() - late * 60000)).day : day;
    if (late >= WINDOW || sentFor === slotDay) continue;
    // habit reminders only on the days the phone asked for; the weekly reflection only on Sunday
    if (/^n\d$/.test(id) && !((rec.nudges || {})[id] || {})[slotDay]) continue;
    if (id === "weekly" && new Date(slotDay + "T12:00:00Z").getUTCDay() !== 0) continue;
    out.push({ id, slotDay });
  }
  return out;
}

module.exports = async (req, res) => {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.authorization || "";
  const key = new URL(req.url, "http://x").searchParams.get("key");
  if (!secret || (auth !== `Bearer ${secret}` && key !== secret)) return json(res, 401, { error: "unauthorized" });

  const missing = config();
  if (missing.length) return json(res, 503, { error: "not_configured", missing });

  const now = new Date();

  // Status (?status=1): when did the cron last run, what is scheduled — sends nothing
  if (new URL(req.url, "http://x").searchParams.get("status") === "1") {
    const last = await redis("GET", "cron:last");
    const subs = (await allSubs()).filter(x => x.rec).map(({ rec }) => ({ tz: rec.tz, now: localNow(rec.tz, now), reminders: rec.reminders, lastSent: rec.lastSent }));
    return json(res, 200, { lastRun: last ? new Date(+last).toISOString() : null, minutesAgo: last ? Math.round((+now - +last) / 60000) : null, subs });
  }

  // Diagnostics (?test=1): send a test to every subscription and report what the push service answers
  if (new URL(req.url, "http://x").searchParams.get("test") === "1") {
    const out = [];
    for (const { rec } of await allSubs()) {
      if (!rec) continue;
      const host = new URL(rec.subscription.endpoint).host;
      try {
        const r = await send(rec, message("test", rec, now.getTime()));
        out.push({ host, tz: rec.tz, status: r.statusCode, body: r.body || "" });
      } catch (e) {
        out.push({ host, tz: rec.tz, status: e.statusCode || null, body: String(e.body || e.message).slice(0, 300) });
      }
    }
    return json(res, 200, { subject: process.env.VAPID_SUBJECT || "(niet ingesteld)", results: out });
  }

  // cron-job.org and the daily Vercel cron can overlap: only one run at a time, so nothing is sent twice
  if ((await redis("SET", "cron:lock", "1", "NX", "EX", 120)) !== "OK") return json(res, 200, { skipped: "already running" });
  try {
    json(res, 200, await run(now));
  } catch (e) {
    await fail(res, e, "cron");
  } finally {
    await redis("DEL", "cron:lock");
  }
};

async function run(now) {
  await redis("SET", "cron:last", String(now.getTime()));
  const report = { subs: 0, sent: 0, removed: 0, errors: 0 };
  for (const { key: k, rec } of await allSubs()) {
    if (!rec) { await deleteSubKey(k); continue; }
    report.subs++;
    const list = due(rec, now);
    if (!list.length) continue;
    rec.lastSent = rec.lastSent || {};
    let gone = false;
    for (const { id, slotDay } of list) {
      try {
        await send(rec, message(id, rec, now.getTime(), slotDay));
        rec.lastSent[id] = slotDay;
        report.sent++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) { gone = true; break; }
        report.errors++;
      }
    }
    if (gone) { await deleteSubKey(k); report.removed++; }
    else await saveSub(rec);
  }
  return report;
}

module.exports.due = due;
