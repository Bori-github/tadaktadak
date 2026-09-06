/** 12 × 12 도트 격자. `I`가 찍는 자리, `.`은 비움 */
export type GridIcon = readonly string[];

export const PLAY_ICON: GridIcon = [
  '...I........',
  '...II.......',
  '...III......',
  '...IIII.....',
  '...IIIII....',
  '...IIIIII...',
  '...IIIIII...',
  '...IIIII....',
  '...IIII.....',
  '...III......',
  '...II.......',
  '...I........',
];

export const PAUSE_ICON: GridIcon = [
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
  '..III..III..',
];

export const STOP_ICON: GridIcon = [
  '............',
  '............',
  '..IIIIIIII..',
  '..IIIIIIII..',
  '..IIIIIIII..',
  '..IIIIIIII..',
  '..IIIIIIII..',
  '..IIIIIIII..',
  '..IIIIIIII..',
  '..IIIIIIII..',
  '............',
  '............',
];
