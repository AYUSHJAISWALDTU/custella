# Backlog

Everything deferred, and everything asked for that isn't in scope. Nothing here gets
built without a decision to move it into a phase. This product's advantage is that it
does one thing in eight seconds; bloat is how that advantage dies.

## Out of scope — reject on sight

Inventory · billing · invoices · payments · WhatsApp campaigns · loyalty points ·
AI features · sales pipelines · deal stages · lead scoring.

## Open findings — raised in review, not yet fixed

Numbering matches the original review. #3 is fixed (see DECISIONS D-004); #8 is proven.

| # | Finding | Severity | Phase |
|---|---|---|---|
| 1 | `submit_lead` has no rate limit; the QR is public by design, so anyone who photographs a card can script thousands of fake leads. No length cap on `p_name` either — one request can write a multi-megabyte name. | 🔴 | 2 (item 5) |
| 2 | The access log and 5-attempt lockout exist **only in demo mode**. Against Supabase, a failed sign-in writes nothing and `S.locked` is hardcoded `false` — so the Access Log screen promises something untrue. | 🔴 | 2 |
| 4 | No session persistence and no token refresh. Refreshing the page signs the shopkeeper out; the access token expires in ~1 hour with no refresh, so the app dies mid-shift with an opaque `401`. | 🟠 | 2 (item 9) |
| 5 | `window.storage` is not a browser API. `saveLocal`/`loadLocal` fail silently inside `try/catch`, so demo mode loses everything on reload. Should be `localStorage`. | 🟠 | 2 |
| 6 | A repeat submit overwrites the stored name, so one mistyped digit silently renames a different customer. The `if found` branch updates the name but the `ON CONFLICT` branch doesn't — behaviour depends on race timing. | 🟡 | 2 |
| 7 | Card codes come from `Math.random()` in the browser; can be under 8 characters and are somewhat predictable. Generation belongs in the DB — `new_card_code()` already exists and is unused by the insert path. | 🟡 | 2 |
| 8 | `norm_phone` silently truncates to the last 10 digits, so `+971 50 123 4567` becomes `1501234567` and passes validation as an Indian mobile. | 🟡 | 2 |
| 9 | Two CDN scripts (`qrcodejs`, `xlsx`) load with no SRI integrity hashes. | 🟢 | 2 |
| 10 | Manual adds are recorded as `source='scan'`. Customer and visit lists cap at 500 rows, so search silently misses older records as a shop grows. | 🟢 | 3 |

## Gaps found in use, not in review

- [ ] **No password reset, anywhere.** A shopkeeper who forgets their password is locked
      out permanently — no "Forgot password" link, no recovery flow, no way back except
      someone with database access resetting it by hand. Found when 25 consecutive
      sign-ins failed against a healthy account. For a product whose user is explicitly
      non-technical, this is close to a launch blocker. Supabase's recovery email works
      (`/verify` traffic is already in the logs), so it's a small piece of work:
      a link on the sign-in screen calling `/auth/v1/recover`.
      **Not in the Phase 2 or Phase 3 lists — needs a decision on where it goes.**

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

- [ ] Installable PWA (manifest + service worker) so the shop side gets a home-screen icon
      and opens fullscreen. Discussed, not chosen.
- [ ] `master` still carries Expo template scaffolding (`App.tsx`, `package.json`,
      `assets/`, `tsconfig.json`) left over from the earlier product. Harmless but untidy.
- [ ] The offline-first React Native app is parked on branch `expo-offline-app` — a
      different product where the shopkeeper types the customer in and needs no internet
      at all. Phase 0 complete: design tokens, i18n (EN + HI), tab shell, Expo SDK 54.

## Phase 1 — outstanding

- [ ] **The phone-scan gate.** No customer has been submitted through a real phone camera
      yet (`customers: 0, visits: 0`). Server-side dedupe is proven by direct API calls,
      but the browser-to-phone path is unverified. Phase 2 does not start until this passes.
