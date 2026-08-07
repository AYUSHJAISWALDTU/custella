# Backlog

Everything deferred, and everything asked for that isn't in scope. Nothing here gets
built without a decision to move it into a phase. This product's advantage is that it
does one thing in eight seconds; bloat is how that advantage dies.

## Out of scope — reject on sight

Inventory · billing · invoices · payments · WhatsApp campaigns · loyalty points ·
AI features · sales pipelines · deal stages · lead scoring.

## Review findings — all but one closed in Phase 2

Numbering matches the original review. Struck rows are done and verified against the
running system.

| # | Finding | Severity | Phase |
|---|---|---|---|
| ~~1~~ | ✅ **Fixed** (rate limited + length capped) — `submit_lead` has no rate limit; the QR is public by design, so anyone who photographs a card can script thousands of fake leads. No length cap on `p_name` either — one request can write a multi-megabyte name. | 🔴 | 2 (item 5) |
| ~~2~~ | ✅ **Fixed** (log now real, false lockout claim removed) — The access log and 5-attempt lockout exist **only in demo mode**. Against Supabase, a failed sign-in writes nothing and `S.locked` is hardcoded `false` — so the Access Log screen promises something untrue. | 🔴 | 2 |
| ~~4~~ | ✅ **Fixed** (sessions persist + auto refresh) — No session persistence and no token refresh. Refreshing the page signs the shopkeeper out; the access token expires in ~1 hour with no refresh, so the app dies mid-shift with an opaque `401`. | 🟠 | 2 (item 9) |
| ~~5~~ | ✅ **Fixed** (localStorage) — `window.storage` is not a browser API. `saveLocal`/`loadLocal` fail silently inside `try/catch`, so demo mode loses everything on reload. Should be `localStorage`. | 🟠 | 2 |
| ~~6~~ | ✅ **Fixed** (name no longer overwritten) — A repeat submit overwrites the stored name, so one mistyped digit silently renames a different customer. The `if found` branch updates the name but the `ON CONFLICT` branch doesn't — behaviour depends on race timing. | 🟡 | 2 |
| ~~7~~ | ✅ **Fixed** (codes generated in the DB) — Card codes come from `Math.random()` in the browser; can be under 8 characters and are somewhat predictable. Generation belongs in the DB — `new_card_code()` already exists and is unused by the insert path. | 🟡 | 2 |
| ~~8~~ | ✅ **Fixed** (non-Indian mobiles rejected) — `norm_phone` silently truncates to the last 10 digits, so `+971 50 123 4567` becomes `1501234567` and passes validation as an Indian mobile. | 🟡 | 2 |
| ~~9~~ | ✅ **Fixed** (SRI pinned) — Two CDN scripts (`qrcodejs`, `xlsx`) load with no SRI integrity hashes. | 🟢 | 2 |
| 10 | Manual adds are recorded as `source='scan'`. Customer and visit lists cap at 500 rows, so search silently misses older records as a shop grows. | 🟢 | 3 |

## Gaps found in use, not in review

- [x] ~~**No password reset, anywhere.**~~ ✅ **Fixed** — request link on the sign-in screen, recovery hash handled, token stripped from the address bar, new password set.
      Found when 25 consecutive sign-ins failed against a perfectly healthy account.

- [x] ~~Error messages spoke Supabase, not shopkeeper.~~ "Invalid login credentials" now
      reads "Wrong email or password. Check both and try again."

## Phase 3 — what a real shop asks for within a week

- [ ] Staff accounts: owner invites by email; staff can add and view but not delete or
      export. Enforced in RLS, not just the UI.
- [ ] Notes on a visit, editable after the fact.
- [ ] Hindi. Every user-facing string moves into an i18n table first, English and Hindi,
      with a switch that also affects the customer form.
- [ ] Offline capture for the **shop** side only. The customer form doesn't need it — a
      customer with no signal can't load the page at all.

## Deferred technical work

- [x] ~~Installable PWA.~~ ✅ Manifest + icons shipped; the shop side installs to the home
      screen and opens fullscreen. A service worker for offline shell caching is **not**
      done — that is the Phase 3 offline item.
- [ ] **Native app vs PWA — undecided.** The PWA covers "an app on my phone". A real
      store-installed app is a separate decision; branch `expo-offline-app` holds a
      WebView-shell start (see DECISIONS D-007).
- [ ] `master` still carries Expo template scaffolding (`App.tsx`, `package.json`,
      `assets/`, `tsconfig.json`) left over from the earlier product. Harmless but untidy.
- [ ] The offline-first React Native app is parked on branch `expo-offline-app` — a
      different product where the shopkeeper types the customer in and needs no internet
      at all. Phase 0 complete: design tokens, i18n (EN + HI), tab shell, Expo SDK 54.

## Phase 1 — closed

- [x] ~~The phone-scan gate.~~ ✅ Passed. A real customer (`source: scan`, card `B06422B4`)
      submitted through a phone camera at 21:52 UTC on 7 Aug 2026.

## Opened by Phase 2

- [ ] **Real sign-in lockout after N failed attempts.** The Access Log records failures but
      cannot stop them — sign-in happens inside GoTrue, which a Postgres function cannot
      block. Needs Supabase Auth hooks or a CAPTCHA on the sign-in form. See DECISIONS D-011.
- [ ] **Editing a customer's name from the shop side.** Repeat submits no longer overwrite a
      stored name (D-009), which closed a corruption bug but leaves no way to fix a genuine
      typo. The shop needs an edit field.
- [ ] **A determined attacker pacing under the rate limit.** Stopping that needs a CAPTCHA,
      which would break rule 1 — the customer never gets an extra step. Accepted for now.
- [ ] **Legal review of the consent notice.** D-014 is a product decision to be plain with
      people, written by an engineer, not reviewed by anyone qualified.

## The two things money buys, not code

- [ ] **Supabase Pro ($25/mo).** The free plan pauses a project after 7 days of low activity.
      Printed cards on a counter would lead to a dead page for the customer, who has no idea
      why. Both of this account's other projects are paused right now, so this is not
      hypothetical. Nothing else on this list matters if the lights go out.
- [ ] **A domain (a few hundred rupees a year).** `ayushjaiswaldtu.github.io/custella/` is a
      personal GitHub account printed onto a shop's counter card. More importantly the URL is
      baked into every QR — **once cards are printed it can never change.** Do this before
      printing anything.
