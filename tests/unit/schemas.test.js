// Request validation (api/_schemas.js): hard fields reject, optional extras fall back to safe defaults
import { describe, it, expect } from "vitest";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const S = require("../../api/_schemas.js");

const sub = { endpoint: "https://web.push.apple.com/abc", keys: { p256dh: "p", auth: "a" } };
const key = n => Buffer.alloc(n, 7).toString("base64url");

describe("Subscribe", () => {
  it("cleans reminders, name, recaps and startDate", () => {
    const r = S.Subscribe.parse({
      subscription: sub, tz: "Europe/Amsterdam",
      reminders: { morning: { on: 1, time: "08:00" }, night: { on: true, time: "25:00" }, hack: { on: true, time: "09:00" } },
      name: "x".repeat(60), startDate: Date.now() + 1e7,
      recaps: [{ day: "2026-09-28", title: "t".repeat(100), body: "b" }, { day: "nope", title: "", body: "" }, 1]
    });
    expect(r.reminders).toEqual({ morning: { on: true, time: "08:00" } });
    expect(r.name).toHaveLength(40);
    expect(r.startDate).toBeNull();
    expect(r.recaps).toEqual([{ day: "2026-09-28", title: "t".repeat(80), body: "b" }]);
  });
  it("defaults missing extras", () => {
    const r = S.Subscribe.parse({ subscription: sub, tz: "UTC" });
    expect(r).toMatchObject({ reminders: {}, name: "", recaps: [], startDate: null });
  });
  it("rejects foreign push hosts and bad time zones", () => {
    expect(S.Subscribe.safeParse({ subscription: { ...sub, endpoint: "https://evil.example/x" }, tz: "UTC" }).success).toBe(false);
    expect(S.Subscribe.safeParse({ subscription: sub, tz: "Mars/Base" }).success).toBe(false);
    expect(S.Subscribe.safeParse({ subscription: sub }).success).toBe(false);
  });
});

describe("Track", () => {
  const t = "a".repeat(32);
  it("sanitises app config", () => {
    const r = S.TrackConfig.parse({ t, tz: "UTC", apps: { instagram: { name: "Instagram", limit: "900" }, "BAD ID": { name: "x" } } });
    expect(r.apps).toEqual({ instagram: { name: "Instagram", e: "📱", limit: 500 } });
  });
  it("rejects short tokens", () => {
    expect(S.TrackDelete.safeParse({ t: "short" }).success).toBe(false);
  });
});

describe("Auth + data", () => {
  it("normalises usernames and checks key lengths", () => {
    expect(S.Login.parse({ action: "login", user: "  Michel ", authKey: key(32) }).user).toBe("michel");
    expect(S.Login.safeParse({ action: "login", user: "michel", authKey: key(16) }).success).toBe(false);
    expect(S.Register.safeParse({ action: "register", user: "a", salt: key(16), authKey: key(32) }).success).toBe(false);
  });
  it("limits the encrypted blob", () => {
    expect(S.DataPut.parse({ blob: { iv: "i", ct: "c" } }).baseRev).toBe(0);
    expect(S.DataPut.safeParse({ blob: { iv: "i", ct: "x".repeat(S.MAX_BLOB + 1) } }).success).toBe(false);
    expect(S.DataPut.safeParse({ blob: { iv: 1, ct: "c" } }).success).toBe(false);
  });
});

describe("Sentry DSN", () => {
  const { sentryTarget } = require("../../api/_lib.js");
  it("builds the envelope endpoint", () => {
    expect(sentryTarget("https://abc@o1.ingest.de.sentry.io/42")).toEqual({ url: "https://o1.ingest.de.sentry.io/api/42/envelope/", key: "abc", dsn: "https://abc@o1.ingest.de.sentry.io/42" });
    expect(sentryTarget("nonsense")).toBeNull();
    expect(sentryTarget("https://o1.ingest.sentry.io/42")).toBeNull();
  });
});
