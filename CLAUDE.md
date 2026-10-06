# Routini — notes for working on this repo

Routini (formerly Rewired; Routine + Houdini) is a Dutch-language iPhone PWA (installed to the home screen) with a small Vercel backend. Deployed from this branch to
https://rewired-one.vercel.app on every push. The design principles behind the features are in `docs/ontwerp.md`;
read it before adding or changing behaviour (plans, reminders, streaks, rewards, wording).

## Stack and layout

- No build step. `index.html` loads plain scripts from `js/` in order; each file is an IIFE that sets one global
  (`Store`, `FX`, `Sound`, `Monitor`, `Push`, `Sync`, `Habits`, `Recap`, `Rewards`, `AppTrack`, `Risk`, `Reflect`, `Routine`, `Focus`, `Learn`, `Tools`, `App`).
  New globals must be added to `biome.json` → `javascript.globals`.
- GSAP 3 is vendored in `js/vendor/` (the CSP only allows `'self'` scripts).
- State: one object in `localStorage["rewired.v1"]` (`js/store.js`). Every new top-level key that the user creates
  data in must also be merged in `Sync.merge` (`js/sync.js`), otherwise it is lost when two phones sync.
- Backend: Vercel functions in `api/` (CommonJS, `module.exports = async (req, res)`), Upstash Redis via REST,
  web-push with VAPID. Files starting with `_` are helpers, not routes. Every request body is validated with the
  Zod schemas in `api/_schemas.js`.
- Push reminders: the phone computes what to send (reminder ids, risk moments, habit nudges per day) and posts it to
  `/api/subscribe`; `api/cron.js` sends what is due. New reminder ids must be added to `REMINDER_IDS` in the schema
  and get a `message()` case in `api/_lib.js`.

## Rules learned the hard way

- Never put a CSS `transition` on `transform`/`opacity` of elements GSAP animates; they fight and freeze mid-way.
- Kill tweens on the old view before replacing it.
- Sheets are z-index 90/91, above fullscreen overlays (60) and onboarding (80).
- Respect reduced motion: check `FX.calm()` before decorative or endless animations.
- After changing any file in the app shell, bump `VERSION` in `sw.js` (and the matching one in `js/monitor.js`),
  and add new files to the `SHELL` list in `sw.js` and a `<script>` tag in `index.html`.
- Storage keys (`rewired.v1`, `rewired.session`, …) and Redis keys keep the old name on purpose: renaming them would
  wipe existing users' data.
- Secrets (VAPID private key, CRON_SECRET, Upstash token, SENTRY_DSN) live only in Vercel env vars.
- UI copy is Dutch, friendly and non-judgemental (see `docs/ontwerp.md` → Taal en feedback).
- Keep the app calm: topic-specific content (porn, gambling, ADHD) only appears for a chosen `state.focus`, and Home
  should not gain permanent cards; temporary ones (starter plan, routine, risk) disappear when done.
- Never run two Playwright runs at the same time: they share `test-results/` and break each other's traces.

## Checks

```bash
npm run lint        # Biome
npm run typecheck   # tsc over api/
npm run test:unit   # Vitest: api logic, schemas, sync merge
npm run test:e2e    # Playwright, iPhone 15 viewport, against tests/support/server.js (fake Redis + push capture)
npm test            # all of the above (also runs in GitHub Actions)
```

E2E tests use `context.clock` for time-dependent features; `tests/support/helpers.js` has `seed`, `skipRecap`
and `closeAllOverlays`. Chromium is at `/opt/pw-browsers` in the cloud sandbox; don't run `playwright install` there.
