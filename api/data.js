/* GET /api/data           → { rev, updated, blob }   (blob = AES-GCM ciphertext made on the phone)
   PUT /api/data { blob, baseRev } → { rev }  or 409 { rev, updated, blob } when another device saved first
   Requires "Authorization: Bearer <token>". The server cannot read the blob. */
const { redis, json, readBody, kvReady, sessionUser, allow } = require("./_lib");

const MAX_BLOB = 900 * 1024;

module.exports = async (req, res) => {
  if (!kvReady()) return json(res, 503, { error: "not_configured" });
  try {
    const user = await sessionUser(req);
    if (!user) return json(res, 401, { error: "unauthorized" });
    const key = "data:" + user;

    if (req.method === "GET") {
      const raw = await redis("GET", key);
      return json(res, 200, raw ? JSON.parse(raw) : { rev: 0, updated: 0, blob: null });
    }

    if (req.method === "PUT") {
      if (!(await allow("put:" + user, 120, 3600))) return json(res, 429, { error: "rate_limited" });
      const { blob, baseRev } = await readBody(req, MAX_BLOB + 4096);
      if (!blob || typeof blob.iv !== "string" || typeof blob.ct !== "string" || blob.ct.length > MAX_BLOB) return json(res, 400, { error: "invalid_blob" });
      const raw = await redis("GET", key);
      const cur = raw ? JSON.parse(raw) : { rev: 0 };
      if ((cur.rev || 0) !== (baseRev || 0)) return json(res, 409, cur);
      const next = { rev: (cur.rev || 0) + 1, updated: Date.now(), blob: { v: 1, iv: blob.iv, ct: blob.ct } };
      await redis("SET", key, JSON.stringify(next));
      return json(res, 200, { rev: next.rev, updated: next.updated });
    }

    json(res, 405, { error: "method" });
  } catch (e) {
    json(res, 500, { error: String(e.message || e) });
  }
};
