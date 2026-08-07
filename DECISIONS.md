# Decisions

Architectural choices and why. Newest phase at the bottom. If a decision is reversed
later, strike it through and add the replacement rather than deleting the history.

---

## Phase 0 — Skeleton, design tokens, i18n

### D-001 · Local SQLite is the source of truth; Supabase is a replica
Reads never touch the network, so there is no "loading" state to design around and no
spinner can ever appear on a save. Supabase becomes a sync target rather than a backend
the UI depends on. **Cost:** every entity needs a local schema, a server schema, and a
mapping between them. Accepted — it's the price of the offline contract.

### D-002 · No React Query
The brief allowed "Zustand or React Query". React Query is a cache for network reads,
and this app performs zero network reads on the UI path. Drizzle's `useLiveQuery` over
expo-sqlite re-renders from SQLite change notifications directly; Zustand holds only
ephemeral UI state (sync badge, quick-add session counter). Adding React Query would
introduce a second cache that could disagree with SQLite.

### D-003 · Routes never touch the database
`app/` contains routes only. Screens call a repository in `src/features/*/repository.ts`,
and repositories are the only code that writes SQLite — always writing the row and its
outbox entry in one transaction. One chokepoint means "every write lands locally first,
then the outbox" cannot be violated by accident once the codebase grows.

### D-004 · One accent colour, near-black text, no dark mode in V1
The app is used outdoors in bright sunlight on cheap screens. `colors.text` is `#141417`,
not a soft grey, and the accent `#3A2FB5` sits at 8.6:1 against white so white button
labels pass WCAG AAA. Dark mode is deferred: it doubles the surface area of every colour
decision and solves a problem (night use) this user does not have. Tokens are structured
so a second palette can be added without touching component code.

### D-005 · Primary action is 72dp, floor is 48dp
`touch.primary` (72) is reserved for "＋ ADD CUSTOMER" so it is unambiguously the largest
element on any screen it appears on. `touch.min` (48) is a hard floor for every other
control, including interest chips.

### D-006 · A single `<Text>` component, no raw `react-native` Text
Off-scale font sizes and stray hex greys are how a sunlight-legible type system quietly
dies. `src/ui/Text.tsx` accepts only tokens from the type scale and the colour palette.

### D-007 · i18n from the first commit, enforced by lint
`eslint-plugin-i18next` fails the build on user-facing string literals in `app/` and
`src/`. Hindi ships with a complete translation file now — not a stub — so the layer is
proven end to end, including Devanagari rendering, before any feature depends on it.
TypeScript module augmentation (`src/i18n/i18next.d.ts`) makes a typo'd key a compile
error, and `__tests__/i18n.test.ts` fails if a locale drifts from the English key set or
loses an interpolation placeholder.

### D-008 · Locale resolution order: business setting, then device
`detectDeviceLocale()` only seeds a brand-new install. Once a business exists,
`businesses.locale` wins — a shop's staff should see one language regardless of whose
phone they pick up.

### D-009 · "Today" means the local calendar day
Timestamps are stored UTC and rendered in device-local time. Day boundaries for the home
counter and stats come from `todayRange()` in local time; using UTC would reset the
counter at 05:30 IST, mid-morning, in front of the user.

### D-010 · `react-dom` pinned via npm `overrides`
~~Pinned to 19.2.3 for SDK 57.~~ **Superseded by D-011** — now pinned to `19.1.0` to
match SDK 54's React.

The underlying bug is version-independent and will recur on every SDK bump:
`@expo/metro-runtime` depends on `react-dom` with a caret range, which resolves to the
newest `react-dom`, which then peer-requires a newer `react` than the SDK pins. npm
resolves this loosely on a first install and then hard-fails `ERESOLVE` on the *next*
`npm install`, which makes it look like the new package is at fault. The override keeps
`react` and `react-dom` in lockstep. It only affects the web target, which V1 does not
ship.

**On any future SDK change, re-pin this to the exact `react` version in `package.json`.**

### D-011 · Pinned to Expo SDK 54 — driven by the target device, not by preference
The project was first scaffolded on SDK 57 (`latest`). It was moved down to SDK 54
because the Expo Go build available on the development device supports SDK 54, and Expo
Go only ever supports one SDK. Since the brief forbids custom native modules in V1,
Expo Go is the whole development loop, so the device wins.

This pins the stack to `react@19.1.0`, `react-native@0.81.5`, `expo-router@6`,
`jest-expo@54`, `eslint-config-expo@10`, `typescript@5.9`.

**Do not run `npx expo upgrade` or bump `expo` without checking the device's Expo Go
version first** — an SDK bump silently breaks the only way the app can be run. The
escape hatch, if a newer SDK is ever needed, is a development build
(`npx expo run:android`, or EAS), which removes the Expo Go version ceiling entirely
while staying inside the managed workflow. That's the migration path, not an upgrade
in place.

Verified on SDK 54: typecheck, lint, i18n tests, and an Android bundle
(`npx expo export`) all pass.

---

## Deferred to their phase

- **Session must survive an expired JWT** (Phase 2). The route guard reads local session
  state, never Supabase token validity. A shopkeeper offline since morning must not be
  ejected to the login screen mid-exhibition.
- **`id_merges` reconciliation** (Phase 6). Client-generated UUIDs mean two offline staff
  produce two ids for one phone number. The push RPC returns the canonical id; the loser
  is recorded so every device converges. The table ships in the Phase 1 schema because
  retrofitting it later would need a data migration.
- **FTS5 over a denormalized `search_blob`** (Phase 4). Keeps search off a full-table
  `LIKE '%x%'` scan at 10,000 rows.
