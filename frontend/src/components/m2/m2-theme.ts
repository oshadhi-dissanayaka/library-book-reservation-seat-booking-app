/**
 * M2 Design Tokens — Member 2 shared color / spacing constants.
 * Aligned with Brand constants in src/constants/brand.ts
 */

export const M2Colors = {
  // Backgrounds
  canvas:       '#F4F6FB',
  cardBg:       '#FFFFFF',
  subtleBg:     '#EEF1F8',
  infoBg:       '#E9EDF9',

  // Primary palette
  navy:         '#102B69',
  blue:         '#2456B3',
  blueSoft:     '#3A6FC9',
  paleBlue:     '#EAF0FC',

  // Text
  ink:          '#17243F',
  secondary:    '#4A5165',
  muted:        '#66738A',
  placeholder:  '#7A8199',

  // Border
  border:       '#E5E9F1',
  borderLight:  '#D7DDEC',

  // Status
  green:        '#16875B',
  paleGreen:    '#E8F6EF',
  red:          '#B33535',
  paleRed:      '#FDECEC',
  amber:        '#B26A00',
  paleAmber:    '#FFF4E2',
} as const;

export const M2Radii = {
  card:    20,
  chip:    12,
  badge:   10,
  button:  16,
} as const;

export const M2Shadow = {
  shadowColor:   '#12203F',
  shadowOpacity: 0.06,
  shadowRadius:  10,
  shadowOffset:  { width: 0, height: 4 },
  elevation:     2,
} as const;
