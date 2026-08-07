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
