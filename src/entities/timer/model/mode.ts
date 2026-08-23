export const TIMER_MODES = ['focus', 'rest'] as const;

export type TimerMode = (typeof TIMER_MODES)[number];
