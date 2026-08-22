import type { TimerMode } from '../model/mode';

/** 타이머 시간 범위 (분). `DESIGN.md` §8 */
export const TIMER_RANGE: Record<TimerMode, { min: number; max: number }> = {
  focus: { min: 1, max: 60 },
  rest: { min: 0, max: 60 },
};

/** 타이머 기본 값 (분). `SPEC.md` 기기에 저장하는 값 */
export const TIMER_DEFAULT: Record<TimerMode, number> = {
  focus: 25,
  rest: 5,
};
