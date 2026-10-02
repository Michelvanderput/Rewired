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
