/**
 * Shared visual tokens for the Library Staff module (WF-16 – WF-23).
 *
 * Values mirror the LibConnect design language already used by the Student
 * screens in `src/app/(tabs)`: deep-navy primary, blue-gray canvas, white
 * cards, subtle hairline borders, and green / red / amber status colors.
 * Keep this file small — it is a palette, not a design system.
 */
export const staffTheme = {
  // Brand & primary surfaces
  navy: '#102B69', // primary actions, active states, header banner
  navySoft: '#1A3576', // pills / badges sitting on the navy header
  navyLine: '#34549C', // borders on the navy header
  navyTint: '#C3D4FB', // accent text on navy, light-blue hairline borders
  navyCopy: '#D8E2F8', // secondary text on navy

  // Text
  ink: '#17243F', // primary text
  muted: '#66738A', // secondary text
  placeholder: '#8792A5', // input placeholders & clear icons

  // Surfaces
  canvas: '#F4F6FB', // page background & soft chips
  white: '#FFFFFF', // cards
  line: '#E5E9F1', // card borders & dividers

  // Status: info / success / danger / warning
  blue: '#2456B3', // links & accent
  paleBlue: '#EAF0FC',
  green: '#16875B',
  paleGreen: '#E8F6EF',
  greenLine: '#BFE3D1',
  red: '#B33535',
  paleRed: '#FFF0EF',
  redLine: '#F0C7C7',
  amber: '#B45309',
  amberDeep: '#92400E',
  paleAmber: '#FEF3C7',
  amberLine: '#FCD34D',

  // Seat map (mirrors the Student reading-room seat colors)
  seatFreeBg: '#EEF1F8',
  seatFreeLine: '#C9D2E8',

  // Small utilities
  liveDot: '#22C55E', // online indicator (bright, for the navy header)
} as const;

export type StaffTheme = typeof staffTheme;
