# Decisions

What was chosen and why. Newest at the bottom. If a decision is reversed, strike it
through and add the replacement rather than deleting the history.

---

## Phase 1 — Go live

### D-001 · Hosted on GitHub Pages, not Vercel or Netlify
The brief asked for "Vercel or Netlify, whichever needs fewer steps from you". Vercel's
connector returned `403 — you don't have permission to create a project` on both the team
and personal scope, and its CLI needs an interactive browser login that can't run from
here. Netlify Drop would have worked but costs you a manual drag on every deploy.

GitHub Pages needed zero clicks and is arguably the better fit: the URL is permanent, so
a QR card printed today still works in two years. Deploys are `git push`.

**Live at** https://ayushjaiswaldtu.github.io/custella/ from `master`.

### D-002 · The app file is `index.html`, not `custella-app-v2.html`
Same file, renamed. Pages serves `index.html` at the directory root, which shortens the
card URL from `.../custella/custella-app-v2.html#/s/CODE` to `.../custella/#/s/CODE`.

That is not just tidiness. `cardLink()` bakes the URL into the QR code, and a shorter
string produces a lower-density QR — fewer modules, larger squares, which a cheap phone
camera locks onto faster in the bad lighting of an exhibition hall. The product's whole
promise is eight seconds; QR acquisition time is part of that budget.

### D-003 · The anon key is committed to a public repo on purpose
In one sentence: **the key inside the web page can only knock on two doors, and both ask
for a card code before they open.**

It is the browser's identity, not a secret. Its power is defined entirely by what the
database permits it to do, and that is: call `get_scan_card()` and `submit_lead()`. Nothing
else. Verified from the command line — all six tables return `401 / 42501
insufficient_privilege`, `get_scan_card` with a bogus code leaks nothing (`{"found":false}`),
and `create_business` refuses an anonymous caller outright.

The key that *would* be dangerous is `service_role`, which bypasses RLS. It is not in the
repo, not in the page, and must never be.

### D-004 · Account creation and shop creation are separate, resumable steps
**This was a bug fix, and the bug stranded the first real user.**

`signUp()` created the auth account and the shop in one uninterruptible sequence. Anything
landing between the two — email confirmation returning no token, a dropped connection, a
failed `create_business` — left an account with no shop. The recovery path was itself
broken: `render()` tested `api.signedIn()` before anything else, so a signed-in user with
no shop skipped the signup form and fell through to `if(!S)`, showing "Loading your shop…"
forever, with no error and no way out. Retrying signup then failed with "User already
registered".

Now `signUp()` performs only the half that is missing: if a token already exists it goes
straight to `create_business`; otherwise it signs up, falls back to signing in when the
account already exists, and only then creates the shop. `render()` treats "signed in but
no shop" as a signup state.

Two consequences worth keeping: **stranded accounts heal themselves on the next sign-in**,
and email confirmation becomes a working path rather than a trap — so the "turn off Confirm
email" instruction in the original quick-reference is now optional.

**Confirmed working in production:** shop `ayush` was created through the repaired flow.

### D-005 · Supabase project in Mumbai (ap-south-1)
Every customer submitting a form is standing in India on mobile data. Region choice is
round-trip latency, and latency is the product. Free tier, $0/month.

### D-006 · Verify, never assume
Each claim in this file was checked against the running system rather than reasoned about:

| Claim | How it was proven |
|---|---|
| anon cannot read any table | `curl` against all 6 tables → `401 / 42501` |
| `norm_phone` handles Indian formats | 5 cases run **in Postgres**, incl. `9198765432` unmangled |
| one number = one customer | 3 formats submitted → 1 customer row, 3 visit rows |
| Devanagari survives storage | `प्रिया शर्मा` round-tripped, 12 chars |
| the deployed page is the page we wrote | SHA-256 of served bytes == local file |

Test fixtures were created with a fixed UUID, used, and deleted. Production is clean.

### D-007 · The Expo app is a thin shell around the live site
The product already has one deployed, phone-sized interface and its QR cards must point
to that public URL. The Expo app therefore opens the live GitHub Pages app in a WebView
instead of maintaining a second implementation that could drift or generate local-only
QR links. The shell is pinned to Expo SDK 54 because that is the installed Expo Go
runtime.

---

## Phase 2 — Harden

### D-008 · Rate limits are deliberately loose, and the per-card ceiling is the real one
`submit_lead` allows 30 submissions per connection per 10 minutes, and 300 per card per
hour. Both numbers are far above any real stall's throughput and far below what a script
needs to be useful.

The per-IP limit cannot be tight, and this is the important part: **at an exhibition every
customer is on the same venue wifi, and Indian mobile carriers put thousands of subscribers
behind one CGNAT address.** A strict per-IP rule would block the hundredth genuine customer
of a busy afternoon. So the per-card ceiling does the real work and the per-IP one exists
only to stop a runaway loop.

What this does **not** stop: a determined attacker pacing requests under the limit. That
needs a CAPTCHA, which would break rule 1 of the product — the customer never signs in and
never gets an extra step. Verified: 30 accepted, blocked from #31 with a message a customer
can act on.

### D-009 · A stored customer name is never overwritten
Previously every repeat submit rewrote `customers.name`. One mistyped digit — a customer
entering someone else's number by accident — silently renamed a different person's record.
The name is now written once, on creation, and only backfilled if it is somehow blank.

Consequence: a genuine correction can no longer be made through the customer form. That is
the right trade — silent corruption of an existing record is far worse than a name that
needs the shop to fix it. Editing from the shop side is in the backlog.

### D-010 · Two bot signals, both failing silently
A honeypot field no human can see, and a two-second minimum time-on-form no human can beat.
Both respond with the ordinary success screen rather than an error, because a bot told it
failed simply retries with the field removed.

The risk this accepts: a password manager auto-filling the hidden "Company" field would
make a real submission vanish. Judged small — the field is off-screen, `aria-hidden`, and
`tabindex="-1"` — and the rate limiter is the actual defence. Revisit if any customer ever
reports submitting and not being called.

### D-011 · The Access Log records only what we can honestly observe
Supabase's `auth.audit_log_entries` is empty on this plan, so these rows are written by our
own `log_signin()` and `log_failed_signin()`.

The screen previously promised "five wrong attempts in a row lock the account". **Nothing
implemented that.** Sign-in happens inside GoTrue, which we cannot block from a Postgres
function, so the claim was deleted rather than faked. The copy now describes exactly what
happens: successful sign-ins and wrong passwords tried against this shop's email are
recorded. Real lockout needs GoTrue-level control and is in the backlog.

`log_failed_signin` is callable by `anon` — it has to be, since a failed sign-in has no
session — so it is throttled to 20 per email per hour and silently ignores emails that
belong to no shop. It cannot be used to flood a shop's screen or to probe which emails
exist.

### D-012 · Sessions survive the reload and the hour
The access token was held in a plain variable: refreshing the page signed the shopkeeper
out, and after roughly an hour every request failed with an opaque `401` mid-shift. Both
tokens now persist in `localStorage`, the refresh token is exchanged on boot, and any `401`
triggers one automatic refresh-and-replay.

`window.storage` — used by the original demo-mode persistence — is not a browser API at
all. The calls were wrapped in `try/catch`, so they failed silently and demo mode lost
everything on reload. Replaced with `localStorage`.

### D-013 · Card codes are generated in the database
The browser used `Math.random()`, which is not uniformly distributed, can return fewer than
8 characters, and never checked for collisions. That code is the only thing standing between
a stranger and a shop's submit endpoint. `create_scan_card()` now generates it server-side
with a uniqueness retry.

### D-014 · A consent notice, because this is personal data collected from the public
Name and mobile number taken from members of the public in India puts this under the DPDP
Act. The form now states who keeps the data, what for, that it is not sold or shared, and
that the person can ask to see, correct, or delete it.

This is a product decision to be plain with people, not legal advice, and it has not been
reviewed by anyone qualified. Worth ten minutes with someone who is before real scale.

### D-015 · The tests read the shipping code, not a copy
`test/identity.test.js` extracts `normPhone()` out of `index.html` and tests that. A copied
implementation would drift from the deployed one and pass while the product broke. CI runs
the 7 tests, parses the app's script, and validates the manifest on every push — there is
no build step that would otherwise catch a syntax error before it reached a shop counter.

### D-016 · Installable, but still one codebase
A PWA manifest and icons make the shop side install to the home screen and open fullscreen,
with no app store and no second implementation to keep in step. The customer side is
untouched: they still scan and type, and never install anything. See BACKLOG for the
native-app question this does not settle.
