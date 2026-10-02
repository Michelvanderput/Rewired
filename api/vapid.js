/* GET /api/vapid → public key the browser needs to subscribe */
const { config, json } = require("./_lib");

module.exports = (_req, res) => {
  const missing = config();
  if (missing.length) return json(res, 503, { error: "not_configured", missing });
  json(res, 200, { publicKey: process.env.VAPID_PUBLIC_KEY });
};
