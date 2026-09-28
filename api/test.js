/* POST /api/test { endpoint } → send a test notification to that subscription right away */
const { config, json, readBody, getSub, message, send } = require("./_lib");

module.exports = async (req, res) => {
  const missing = config();
  if (missing.length) return json(res, 503, { error: "not_configured", missing });
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  try {
    const { endpoint, delay } = await readBody(req);
    const rec = endpoint && await getSub(endpoint);
    if (!rec) return json(res, 404, { error: "not subscribed" });
    // give the user time to leave the app: iOS shows no banner while the web app is in front
    const wait = Math.min(Math.max(+delay || 0, 0), 8);
    if (wait) await new Promise(r => setTimeout(r, wait * 1000));
    await send(rec, message("test", rec));
    json(res, 200, { ok: true });
  } catch (e) {
    json(res, e.statusCode === 410 || e.statusCode === 404 ? 410 : 500, { error: String(e.body || e.message || e) });
  }
};
