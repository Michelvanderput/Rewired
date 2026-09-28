/* POST /api/test { endpoint } → send a test notification to that subscription right away */
const { config, json, readBody, getSub, message, send } = require("./_lib");

module.exports = async (req, res) => {
  const missing = config();
  if (missing.length) return json(res, 503, { error: "not_configured", missing });
  if (req.method !== "POST") return json(res, 405, { error: "method" });
  try {
    const { endpoint } = await readBody(req);
    const rec = endpoint && await getSub(endpoint);
    if (!rec) return json(res, 404, { error: "not subscribed" });
    await send(rec, message("test", rec));
    json(res, 200, { ok: true });
  } catch (e) {
    json(res, e.statusCode === 410 || e.statusCode === 404 ? 410 : 500, { error: String(e.body || e.message || e) });
  }
};
