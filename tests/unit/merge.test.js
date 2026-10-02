// Merging two devices' state (js/sync.js), loaded in a sandbox with minimal stubs
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

function loadSync() {
  const win = {};
  const ctx = {
    window: win, localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    FX: { $: () => null, $$: () => [], esc: s => s, haptic() {}, toast() {}, sheet() {} },
    Store: { save() {}, s: {} }, TextEncoder, TextDecoder, crypto: globalThis.crypto, btoa, atob, console
  };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, "../../js/sync.js"), "utf8"), ctx);
  return win.Sync;
}
const { merge } = loadSync();
const D = 864e5;
const base = (o = {}) => ({ onboarded: true, startDate: 1000, firstStart: 1000, relapses: [], urges: [], journal: [], sessionLog: [], checkins: {}, reset: {}, habitLog: {}, habitVal: {}, lessonsDone: [], celebrated: [], sessions: {}, bestStreak: 0, ...o });

describe("Sync.merge", () => {
  it("takes everything from the cloud on a fresh phone", () => {
    const out = merge({ onboarded: false, push: { subscribed: true } }, base({ name: "Michel" }));
    expect(out.name).toBe("Michel");
    expect(out.push).toEqual({ subscribed: true });
  });
  it("combines journal entries from both devices", () => {
    const a = base({ updatedAt: 2, journal: [{ ts: 10, text: "A" }] });
    const b = base({ updatedAt: 1, journal: [{ ts: 20, text: "B" }] });
    expect(merge(a, b).journal.map(j => j.text)).toEqual(["A", "B"]);
  });
  it("a relapse on one device resets the streak on the other", () => {
    const a = base({ updatedAt: 5, startDate: 1000 });
    const b = base({ updatedAt: 1, startDate: 1000, relapses: [{ ts: 5000 }] });
    expect(merge(a, b).startDate).toBe(5000);
  });
  it("keeps the best streak and the earliest start", () => {
    const out = merge(base({ updatedAt: 2, bestStreak: 3 * D, firstStart: 500 }), base({ updatedAt: 1, bestStreak: 9 * D, firstStart: 200 }));
    expect(out.bestStreak).toBe(9 * D);
    expect(out.firstStart).toBe(200);
  });
  it("merges habit values per day", () => {
    const a = base({ updatedAt: 2, habitVal: { "2026-10-01": { w: 500 } } });
    const b = base({ updatedAt: 1, habitVal: { "2026-10-01": { p: 30 }, "2026-09-30": { w: 2000 } } });
    expect(merge(a, b).habitVal).toEqual({ "2026-10-01": { p: 30, w: 500 }, "2026-09-30": { w: 2000 } });
  });
  it("keeps the highest session counters", () => {
    expect(merge(base({ updatedAt: 2, sessions: { light: 1, breath: 5 } }), base({ updatedAt: 1, sessions: { light: 3 } })).sessions).toEqual({ light: 3, breath: 5 });
  });
});
