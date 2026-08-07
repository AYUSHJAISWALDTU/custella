# Backlog

Everything asked for that is not V1. Nothing here gets built without an explicit
decision to move it into a version. The V1 scope is 10 items; bloat is the main way
this product dies.

## Out of scope — permanently, unless the product changes direction

Inventory · billing · invoices · payments · WhatsApp campaigns · loyalty points ·
coupons · AI features · sales pipelines · deal stages · lead scoring · calendars ·
attendance · accounting.

## V2

- [ ] Follow-up reminders
- [ ] Customer tags (schema already ships in V1, no UI)
- [ ] Hindi interface (translation file already ships; needs a language switcher in Settings)
- [ ] CSV / Excel import
- [ ] Staff management and invites (V1 has owner-only; see open question OQ-2)

## V3

- [ ] WhatsApp integration
- [ ] Birthday / festival reminders
- [ ] Customer segmentation
- [ ] Simple campaigns

## Business tier

- [ ] Multiple branches
- [ ] Advanced reports
- [ ] Manager permissions

## AI tier

- [ ] Natural-language queries ("customers who visited in the last six months but haven't returned")

## Deferred technical work

- [ ] Dark mode (see DECISIONS D-004)
- [ ] Second CSV export at visit granularity (V1 exports one row per customer)
- [ ] Backdating a visit — V1 always stamps today, to save taps at the counter
- [ ] Restoring a soft-deleted customer — would need a third button on the duplicate
      card, which the one rule forbids
- [ ] Web target (`react-dom` override in D-010 assumes web is not shipped)
- [ ] Move from Expo Go to a development build. Would lift the SDK 54 ceiling (D-011)
      and let the project track current Expo. Needs Android Studio locally or a free
      Expo account for EAS. Not required for V1 — nothing in the V1 scope needs a
      custom native module.

## Open questions carried forward

- **OQ-1** SMS provider for phone OTP. Supabase phone auth needs Twilio/MSG91 and has no
  free tier. Phase 2 will build against Supabase test OTP numbers; real credentials are
  needed before the Done checklist can pass.
- **OQ-2** How a second staff member joins a business. Done-checklist item 3 ("two staff,
  both offline, same number") needs two profiles in one business. Plan: seed the second
  profile via SQL for the test, build no invite UI in V1.
- **OQ-3** Whether to provision the Supabase project via MCP or hand over
  `supabase/migrations/*.sql` to run manually. Defaulting to emitting files.
