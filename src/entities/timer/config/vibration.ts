import { type HapticEvent } from '@modules/haptic-pattern';

import { type TimerMode } from '../model/mode';

/** 타이머별 완료 진동. 화면을 보지 않고 어느 타이머가 끝났는지 알도록 감촉을 다르게 함 */
export const COMPLETION_PATTERN: Record<TimerMode, HapticEvent[]> = {
  focus: [
    { type: 'transient', timeMs: 0, intensity: 1, sharpness: 0.9 },
    { type: 'transient', timeMs: 180, intensity: 1, sharpness: 0.9 },
    { type: 'transient', timeMs: 360, intensity: 1, sharpness: 0.9 },
  ],
  rest: [{ type: 'continuous', timeMs: 0, durationMs: 900, intensity: 0.7, sharpness: 0.2 }],
};
