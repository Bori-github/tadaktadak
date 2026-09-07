import { type HapticEvent } from '@modules/haptic-pattern';

import { type TimerMode } from '../model/mode';

export const COMPLETION_PATTERN: Record<TimerMode, HapticEvent[]> = {
  // `intensity` 1.0이 이벤트 하나의 상한이라, 세기를 더 올리려고 같은 시각에 겹쳐 둠
  focus: [
    { type: 'continuous', timeMs: 0, durationMs: 60, intensity: 1, sharpness: 0.3 },
    { type: 'transient', timeMs: 0, intensity: 1, sharpness: 0.9 },
    { type: 'continuous', timeMs: 180, durationMs: 60, intensity: 1, sharpness: 0.3 },
    { type: 'transient', timeMs: 180, intensity: 1, sharpness: 0.9 },
    { type: 'continuous', timeMs: 360, durationMs: 60, intensity: 1, sharpness: 0.3 },
    { type: 'transient', timeMs: 360, intensity: 1, sharpness: 0.9 },
  ],
  rest: [{ type: 'continuous', timeMs: 0, durationMs: 900, intensity: 1, sharpness: 0.2 }],
};
