/**
 * Custella design tokens.
 *
 * Constraints these values are solving for, from the brief:
 *   - Used outdoors in bright sunlight  -> very high text contrast, no mid-greys on white
 *   - One-handed, gloved/sweaty thumbs   -> 48dp minimum target, 72dp for the primary action
 *   - Low-end 3GB Android                -> flat colours, no gradients, no shadow layers
 *   - One accent colour only             -> `accent`. Everything else is neutral or semantic.
 *
 * Do not introduce a raw hex value anywhere else in the app. If a colour is missing,
 * add it here with a comment explaining what it is for.
 */

/** Light-mode only in V1. See DECISIONS.md ("No dark mode in V1"). */
export const colors = {
  // Surfaces
  bg: '#FFFFFF',
  surface: '#F6F6F7',
  surfaceSunken: '#EFEFF1',
  border: '#DEDEE3',
  borderStrong: '#C4C4CC',

  // Text — primary is near-black for sunlight legibility, not a soft grey.
  text: '#141417',
  textSecondary: '#4B4B55',
  /** Only for non-essential text. Never use for anything the user must read outdoors. */
  textMuted: '#71717A',
  textInverse: '#FFFFFF',

  // The single accent. Deep indigo: 8.6:1 against white, so white text on it passes AAA.
  accent: '#3A2FB5',
  accentPressed: '#2E2590',
  accentSubtle: '#EEEDFA',

  // Semantic — reserved for sync state and destructive actions. Never decorative.
  /** 🟢 synced */
  success: '#15803D',
  successSubtle: '#E8F5EC',
  /** 🟠 offline / pending */
  warning: '#B45309',
  warningSubtle: '#FDF3E7',
  /** destructive actions, validation errors */
  danger: '#B3261E',
  dangerSubtle: '#FCEDEC',
} as const;

/** 4pt grid. Generous by default — the brief asks for spacing over borders. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/**
 * Type scale. Deliberately larger than a typical app at every step —
 * body text is 17pt, not 14pt, because this is read at arm's length in sunlight.
 */
export const type = {
  display: { fontSize: 34, lineHeight: 40, fontWeight: '700' },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  h3: { fontSize: 19, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  bodyStrong: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  label: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  /** Primary button label. Big enough to read without looking directly at the phone. */
  button: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
} as const;

/** Touch target floors. `min` is the hard accessibility floor — never go below it. */
export const touch = {
  min: 48,
  comfortable: 56,
  /** The "+ ADD CUSTOMER" button. Intentionally the largest element on any screen. */
  primary: 72,
} as const;

export type ColorToken = keyof typeof colors;
export type TypeToken = keyof typeof type;
