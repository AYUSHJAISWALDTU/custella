# CUSTELLA — PROMPT FOR THE AI

Attach `custella-app-v2.html` and `custella-supabase.sql`, then paste the block below.
Best in **Claude Code** (it can edit the files and run the deploy). Works in Claude.ai chat too.

---

```
You are my senior full-stack engineer. I have a working prototype of an app called
Custella and I want you to take it live. Read both attached files fully before touching
anything.

── WHAT CUSTELLA IS ───────────────────────────────────────
A customer-capture tool for small Indian shops, salons, property dealers and exhibition
stalls. The shopkeeper prints a QR "scan card" and puts it on the counter. A customer
points their phone at it, types their name and mobile number, and taps once. That's it.
The shopkeeper gets a permanent record of who came, what they asked about, where, and
when — and can download the whole thing as an Excel sheet.

Tagline: Remember Every Customer.

── THE TWO RULES THAT DEFINE THIS PRODUCT ─────────────────
1. THE CUSTOMER NEVER SIGNS IN. No account, no password, no app install, no OTP.
   Two fields and a button. If a change would add a step for the customer, reject it.
2. PHONE NUMBER = CUSTOMER IDENTITY. One number is one customer per shop, forever.
   9876543210, +91 98765 43210 and 098765-43210 are the same person. New scans by a
   known number add a VISIT, never a second customer.

── WHAT I ALREADY HAVE ────────────────────────────────────
custella-app-v2.html — a single-file app with both sides built:
  • shop side: sign in, counter dashboard, scan-card maker with live QR, customer list
    and search, customer profile with visit timeline, access log, Excel export
  • customer side: the public form at #/s/<CARD_CODE>, and a printed confirmation slip
  • an API adapter with two implementations: `local` (device-only demo) and `remote`
    (Supabase). It switches on whether SUPABASE_URL and SUPABASE_ANON_KEY are filled in.

custella-supabase.sql — the full database: tables, indexes, RLS policies, and three
functions. The security model is deliberate and must not be weakened:
  • the shop team is authenticated; RLS locks every row to their own business
  • the anonymous customer has NO table access at all
  • the customer can only reach two SECURITY DEFINER functions: get_scan_card() and
    submit_lead(). submit_lead does the dedupe server-side so two people submitting the
    same number at the same instant still produce one customer.

── YOUR JOB, IN ORDER ─────────────────────────────────────

PHASE 1 — GO LIVE
  1. Walk me through creating a Supabase project (free tier is fine) and running the SQL.
  2. Tell me exactly where to find SUPABASE_URL and the anon key, and paste them into the
     CONFIG block at the top of the HTML.
  3. Deploy the HTML to a real URL. Vercel or Netlify, whichever needs fewer steps from me.
  4. Verify end to end on my actual phone: make a scan card in the shop view, scan the QR
     with the phone camera, submit a name and number, and confirm it appears in the shop's
     customer list within seconds.
  Do not move on until I confirm that scan worked from a phone.

PHASE 2 — HARDEN
  5. Rate-limit submit_lead so nobody can spam a shop's list from a script. Do it in the
     database (a per-card counter table or pg_cron cleanup), not in the browser.
  6. Add a honeypot field and a minimum time-on-form check to stop naive bots.
  7. Add a "wrong card code" and "network died" path to the customer form that tells the
     person what to do instead of failing silently.
  8. Confirm with a hand-crafted request that the anon key cannot read the customers
     table. Show me the request and the refusal.
  9. Session handling: keep the shopkeeper signed in across page reloads using the
     Supabase refresh token, and sign them out cleanly when it expires.

PHASE 3 — THE THINGS A REAL SHOP WILL ASK FOR WITHIN A WEEK
  10. Staff accounts: the owner invites a staff member by email; staff can add and view
      customers but cannot delete or export. Enforce it in RLS, not just the UI.
  11. Notes on a visit, editable by the shop after the fact.
  12. Hindi. Every user-facing string must move into an i18n table first — English and
      Hindi, with a language switch that also affects the customer form.
  13. Offline capture for the SHOP side: if the shop's own phone loses signal at an
      exhibition, queue writes locally and sync when it returns. The customer form does
      not need this — a customer with no signal can't load the page anyway.

── DO NOT BUILD ───────────────────────────────────────────
Inventory, billing, invoices, payments, WhatsApp campaigns, loyalty points, AI features,
sales pipelines, deal stages. If I ask for one of these, remind me it's out of scope and
put it in BACKLOG.md. This product's advantage is that it does one thing in eight seconds.

── HOW WE WORK ────────────────────────────────────────────
• Stop for my approval at the end of each phase.
• When you change the HTML, change it in place — don't rewrite it from scratch and don't
  reorganise code I didn't ask you to touch.
• Explain any security decision in one plain sentence I could repeat to my mother, who
  will be the one actually using this.
• Keep DECISIONS.md (what you chose and why) and BACKLOG.md (what we deferred).

── DONE MEANS ─────────────────────────────────────────────
□ A stranger's phone can scan the printed card and submit, with no app and no login
□ The same number submitted twice makes one customer with two visits
□ Two shops on the same install cannot see each other's customers, ever
□ The anon key cannot read any table directly — proven, not assumed
□ Excel export opens in Excel with Devanagari names intact
□ The whole customer flow works in under 10 seconds on a mid-range Android over 4G

START HERE: read both files, then tell me (a) anything in the SQL or the HTML you think
is wrong or unsafe, and (b) the exact first three things I need to click. Don't write
code until I've answered.
```

---

## Quick reference — going live yourself

1. **supabase.com** → New project. Pick the Mumbai/Singapore region for Indian users.
2. **SQL Editor** → paste all of `custella-supabase.sql` → Run.
3. **Project Settings → API** → copy the Project URL and the `anon public` key.
4. Open `custella-app-v2.html`, find the CONFIG block at the top of the script, paste both in.
5. **Authentication → Providers → Email** → turn off "Confirm email" while testing, back on before real use.
6. Host the file anywhere static — drag it onto Netlify Drop for a URL in about thirty seconds.
7. Open the URL, create your shop, make a scan card, and scan it with a different phone.

The QR encodes `your-url/#/s/CODE`, so the QR only works once the file is hosted at a real
address. From `file://` on your laptop, use the "Open form" button instead.
