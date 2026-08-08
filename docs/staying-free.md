# Staying on the free tier

Why `.github/workflows/keepalive.yml` exists, and what the alternatives to Supabase Pro
actually cost.

## The problem

Supabase pauses Free Plan projects that see low database activity over a **7-day window**.

For most side projects that's an annoyance. For Custella it's a product failure, because
the surface is a **printed QR card on a shop counter**. If the project pauses, every card
leads to a dead page — and the person hitting it is a *customer*, not the developer. They
have no idea why, no way to report it, and they walk away. The shopkeeper may not notice
for days. **A printed card cannot be recalled.**

Not hypothetical — the other two projects on this account are paused right now:

```
odhni.hindustani2           INACTIVE
odhni-hindustani-paridhan   INACTIVE
custella                    ACTIVE_HEALTHY
```

There's a cliff behind the pause too: one-click restore expires after 90 days, after which
you're downloading a backup and restoring it by hand.

## What we do instead — free

`keepalive.yml` runs twice a day and calls `get_scan_card` with a code that matches
nothing. That's a real `SELECT` across two tables, no writes, no side effects.

Supabase's own docs say a few database requests a day keep a project out of the pause
queue, and explicitly list making API calls to your project as a supported prevention
method. This is that, automated.

The step **fails loudly on anything but a 200**. A keep-alive that breaks silently is worse
than none, because you'd believe you were covered right up until the cards went dead.

**Caveat:** GitHub disables scheduled workflows on a repo with no commits for 60 days. If
you stop pushing for two months, push once or hit *Run workflow* to re-arm it.

**What it does not buy:** the free plan still has no downloadable backups, no support
channel, and no guarantee. It removes the *pause* risk, not the *free-tier* risk.

## Alternatives, if the free tier is ever outgrown

| Option | Cost | Migration | Solves the pause? |
|---|---|---|---|
| **Keep-alive cron** (shipped) | Free | None | Yes, in practice |
| Restore by hand when it pauses | Free | None | Only after it breaks |
| [Neon](https://neon.com/pricing) | Free tier | Days — auth is yours | Yes, by design |
| [Self-host](https://supabase.com/docs/guides/self-hosting) on a free VM | Free tier | Days, then forever | Yes, you own uptime |
| Firebase / Cloudflare D1 | Free tier | Full rewrite | Yes |
| Supabase Pro | $25/mo | None | Yes, guaranteed |

**Neon** is the real free alternative: actual Postgres, so the schema, RLS policies and all
five functions move across nearly unchanged, and it scales to zero and wakes on request
rather than dying after a week. The catch is authentication — Supabase gives you GoTrue
(sign-up, sign-in, password reset, JWTs) for free; Neon gives you a database. Auth is the
part that's unforgiving to get wrong.

**Self-hosting** keeps everything including auth, but you become the sysadmin: backups,
patches, TLS, disk monitoring, and being the person who gets woken up.

**Firebase / D1** don't speak Postgres. The entire security model — RLS plus the two
`SECURITY DEFINER` functions that are the only doors the anon key can knock on — would be
rewritten in a different paradigm and re-proven from scratch. That security model is the
most valuable thing in this project; rewriting it to save $25/month is a bad trade.

## Recommendation

1. **Now** — nothing. The keep-alive is free and running.
2. **Before printing a single card** — buy the domain. Urgent, and unrelated to the
   database: the URL is baked into every QR, so once cards are printed it can never change.
3. **When a real shop depends on this** — pay for Pro. Not because the keep-alive stops
   working, but because you'll want downloadable backups and a support channel, and $25 is
   cheap against one shop's customer list.
4. **Only if the free tier stops fitting** — look at Neon, and budget real time for auth.

## Sources

- [Supabase — Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Supabase — Production Checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
- [Supabase — pricing](https://supabase.com/pricing)
- [Neon — pricing](https://neon.com/pricing)
- [Supabase — self-hosting](https://supabase.com/docs/guides/self-hosting)
- [Oracle Cloud — always-free tier](https://www.oracle.com/cloud/free/)
- [Firebase — pricing](https://firebase.google.com/pricing)
- [Cloudflare D1 — pricing](https://developers.cloudflare.com/d1/platform/pricing/)

Free-tier limits change often. Read the current caps and prices off those pages rather than
trusting this document.
