/** 타이머 시간 범위 (분). `DESIGN.md` §8 */
export const TIMER_RANGE = {
  focus: { min: 1, max: 60 },
  rest: { min: 0, max: 60 },
} as const;
