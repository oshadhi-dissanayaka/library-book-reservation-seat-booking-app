/**
 * Shared LibConnect brand colors for the launch / onboarding / portal /
 * home screens.
 *
 * These are the exact same values already used by the Student screens
 * (books.tsx, explore.tsx, my-reservations.tsx) — re-exported so the new
 * screens do not introduce a third palette.
 */
export const Brand = {
  navy: '#102b69',
  navyDeep: '#0b1e4d',
  blue: '#2456b3',
  blueSoft: '#3a6fc9',
  canvas: '#f4f6fb',
  ink: '#17243f',
  muted: '#66738a',
  line: '#e5e9f1',
  white: '#ffffff',
  paleBlue: '#eaf0fc',
  green: '#16875b',
  paleGreen: '#e8f6ef',
  red: '#b33535',
  amber: '#b26a00',
  paleAmber: '#fff4e2',
} as const;

/** Time-of-day greeting used on Home. */
export function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
