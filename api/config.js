/* GET /api/config → public settings for the app.
   sentryDsn: only when error reporting is configured (the DSN is public by design; users still opt in). */
const { json } = require("./_lib");

module.exports = (_req, res) => {
  json(res, 200, { sentryDsn: process.env.SENTRY_DSN || null });
};
