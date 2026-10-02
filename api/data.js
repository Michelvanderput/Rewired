/* GET /api/data           → { rev, updated, blob }   (blob = AES-GCM ciphertext made on the phone)
   PUT /api/data { blob, baseRev } → { rev }  or 409 { rev, updated, blob } when another device saved first
   Requires "Authorization: Bearer <token>". The server cannot read the blob. */
const { redis, json, readBody, kvReady, sessionUser, allow, fail } = require("./_lib");
const { DataPut, MAX_BLOB } = require("./_schemas");

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
      const p = DataPut.safeParse(await readBody(req, MAX_BLOB + 4096));
      if (!p.success) return json(res, 400, { error: "invalid_blob" });
      const { blob, baseRev } = p.data;
      const raw = await redis("GET", key);
      const cur = raw ? JSON.parse(raw) : { rev: 0 };
      if ((cur.rev || 0) !== baseRev) return json(res, 409, cur);
      const next = { rev: (cur.rev || 0) + 1, updated: Date.now(), blob: { v: 1, iv: blob.iv, ct: blob.ct } };
      await redis("SET", key, JSON.stringify(next));
      return json(res, 200, { rev: next.rev, updated: next.updated });
    }

    json(res, 405, { error: "method" });
  } catch (e) {
    await fail(res, e, "data");
  }
};
