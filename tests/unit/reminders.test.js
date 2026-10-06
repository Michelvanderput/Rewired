// Reminder scheduling and messages (api/cron.js + api/_lib.js)
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { due } = require("../../api/cron.js");
const { message, localNow, validTime, validTz, validSubscription } = require("../../api/_lib.js");

const R = { morning: { on: true, time: "08:00" }, evening: { on: true, time: "21:00" }, night: { on: true, time: "23:30" }, midday: { on: false, time: "12:30" } };
const rec = (last = {}) => ({ tz: "Europe/Amsterdam", reminders: R, lastSent: last, startDate: Date.parse("2026-09-16T10:00:00Z"), name: "Michel" });
const at = s => new Date(s);

describe("due()", () => {
  it("sends nothing before the time", () => expect(due(rec(), at("2026-09-28T05:59:00Z"))).toEqual([]));
  it("sends the morning reminder at 08:00 Amsterdam (summer time)", () =>
    expect(due(rec(), at("2026-09-28T06:00:00Z"))).toEqual([{ id: "morning", slotDay: "2026-09-28" }]));
  it("still sends within the 90 minute window", () => expect(due(rec(), at("2026-09-28T07:25:00Z"))).toHaveLength(1));
  it("skips when more than 90 minutes late", () => expect(due(rec(), at("2026-09-28T07:31:00Z"))).toHaveLength(0));
  it("never sends twice on the same day", () => expect(due(rec({ morning: "2026-09-28" }), at("2026-09-28T06:10:00Z"))).toHaveLength(0));
  it("sends again the next day", () => expect(due(rec({ morning: "2026-09-27" }), at("2026-09-28T06:10:00Z"))).toHaveLength(1));
  it("ignores reminders that are switched off", () => expect(due(rec(), at("2026-09-28T10:30:00Z"))).toHaveLength(0));
  it("assigns a 23:30 reminder sent after midnight to the previous day", () =>
    expect(due(rec(), at("2026-09-28T22:15:00Z"))).toEqual([{ id: "night", slotDay: "2026-09-28" }]));
  it("does not repeat the night reminder after midnight", () =>
    expect(due(rec({ night: "2026-09-28" }), at("2026-09-28T22:15:00Z"))).toHaveLength(0));
  it("follows winter time", () => {
    expect(due(rec(), at("2026-12-01T06:00:00Z"))).toHaveLength(0);
    expect(due(rec(), at("2026-12-01T07:00:00Z")).map(d => d.id)).toEqual(["morning"]);
  });
});

describe("localNow()", () => {
  it("works in other time zones", () => expect(localNow("America/New_York", at("2026-09-28T12:00:00Z")).min).toBe(8 * 60));
  it("returns the local date", () => expect(localNow("America/Curacao", at("2026-09-29T02:00:00Z")).day).toBe("2026-09-28"));
});

describe("message()", () => {
  const now = Date.parse("2026-09-28T06:00:00Z");
  it("shows the streak day in the morning", () => expect(message("morning", rec(), now).title).toBe("Dag 11 🔥"));
  it("celebrates a milestone", () => expect(message("morning", { ...rec(), startDate: now - 7 * 864e5 - 1000 }, now).title).toContain("1 week"));
  it("uses yesterday's recap when available", () => {
    const m = message("morning", { ...rec(), recaps: [{ day: "2026-09-27", title: "Recap: 67%", body: "✅ Push-ups" }] }, now);
    expect(m.title).toBe("☀️ Recap: 67%");
    expect(m.url).toContain("open=recap");
  });
  it("opens the check-in from the evening reminder", () => expect(message("evening", rec(), now).url).toContain("open=checkin"));
});

describe("validation", () => {
  it("accepts HH:MM only", () => {
    expect(validTime("08:00")).toBe(true);
    expect(validTime("8:00")).toBe(false);
    expect(validTime("24:00")).toBe(false);
  });
  it("checks time zones", () => {
    expect(validTz("Europe/Amsterdam")).toBe(true);
    expect(validTz("Mars/Base")).toBe(false);
  });
  it("only accepts known push services", () => {
    const keys = { p256dh: "x", auth: "y" };
    expect(validSubscription({ endpoint: "https://web.push.apple.com/abc", keys })).toBe(true);
    expect(validSubscription({ endpoint: "https://evil.example.com/abc", keys })).toBe(false);
    expect(validSubscription({ endpoint: "http://web.push.apple.com/abc", keys })).toBe(false);
  });
});

describe("risk-moment reminders", () => {
  const { Subscribe } = require("../../api/_schemas.js");
  const sub = { endpoint: "https://web.push.apple.com/x", keys: { p256dh: "p", auth: "a" } };
  it("accepts up to 3 risk reminders with labels", () => {
    const r = Subscribe.parse({ subscription: sub, tz: "UTC",
      reminders: { risk0: { on: true, time: "21:45" }, risk3: { on: true, time: "10:00" } },
      risks: [{ label: "22:00–00:00", detail: "meestal slaapkamer · moe", tip: "Ga eerder slapen." }, "bad", {}] });
    expect(r.reminders).toEqual({ risk0: { on: true, time: "21:45" } });
    expect(r.risks).toEqual([{ label: "22:00–00:00", detail: "meestal slaapkamer · moe", tip: "Ga eerder slapen." }, null, null]);
  });
  it("builds a message from the label", () => {
    const m = message("risk0", { risks: [{ label: "22:00–00:00", detail: "meestal slaapkamer · moe", tip: "Ga eerder slapen." }] });
    expect(m.title).toBe("⚠️ Over 15 min: jouw risicomoment (22:00–00:00)");
    expect(m.body).toBe("Meestal slaapkamer · moe. Ga eerder slapen.");
    expect(message("risk2", { name: "Michel" }).body).toMatch(/kwam drang vaak op, Michel/);
  });
  it("is due like any other reminder", () => {
    const rec = { tz: "Europe/Amsterdam", reminders: { risk0: { on: true, time: "21:45" } }, lastSent: {} };
    expect(due(rec, new Date("2026-10-07T19:50:00Z")).map(d => d.id)).toEqual(["risk0"]);
  });
});

describe("habit nudges and weekly reflection", () => {
  const { Subscribe } = require("../../api/_schemas.js");
  const sub = { endpoint: "https://web.push.apple.com/x", keys: { p256dh: "p", auth: "a" } };
  const base = { tz: "Europe/Amsterdam", lastSent: {} };
  it("only sends a habit nudge on the days the phone asked for", () => {
    const rec = { ...base, reminders: { n0: { on: true, time: "07:30" } }, nudges: { n0: { "2026-10-07": { title: "🌅 Ochtend: push-ups", body: "Klein beginnen mag: 5 push-ups." } } } };
    expect(due(rec, new Date("2026-10-07T05:40:00Z")).map(d => d.id)).toEqual(["n0"]);
    expect(due(rec, new Date("2026-10-08T05:40:00Z"))).toEqual([]);
    expect(message("n0", rec, Date.parse("2026-10-07T05:40:00Z"), "2026-10-07").title).toBe("🌅 Ochtend: push-ups");
  });
  it("sends the weekly reflection only on Sunday", () => {
    const rec = { ...base, reminders: { weekly: { on: true, time: "19:00" } } };
    expect(due(rec, new Date("2026-10-04T17:10:00Z")).map(d => d.id)).toEqual(["weekly"]); // Sunday
    expect(due(rec, new Date("2026-10-05T17:10:00Z"))).toEqual([]); // Monday
    expect(message("weekly", { name: "Michel" }).url).toBe("./?open=reflect");
  });
  it("validates nudges", () => {
    const r = Subscribe.parse({ subscription: sub, tz: "UTC", nudges: { n0: { "2026-10-07": { title: "a", body: "b" }, nope: { title: "x", body: "y" } }, n9: {} } });
    expect(r.nudges).toEqual({ n0: { "2026-10-07": { title: "a", body: "b" } } });
  });
});

describe("routine reminders", () => {
  it("skip the day the routine is already done", () => {
    const rec = { tz: "Europe/Amsterdam", lastSent: {}, reminders: { rmorning: { on: true, time: "07:00" }, revening: { on: true, time: "22:00" } }, doneDays: { revening: "2026-10-06" } };
    expect(due(rec, new Date("2026-10-06T20:10:00Z"))).toEqual([]); // 22:10, evening already done
    expect(due(rec, new Date("2026-10-07T05:10:00Z")).map(d => d.id)).toEqual(["rmorning"]);
    expect(message("rmorning", { name: "Michel" }).url).toBe("./?open=routine-morning");
    expect(message("revening", {}).url).toBe("./?open=routine-evening");
  });
});
