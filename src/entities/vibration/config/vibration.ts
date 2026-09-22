import { type HapticEvent } from '@modules/haptic-pattern';

/** 손잡이 조작과 버튼 누름의 진동 패턴. `SPEC.md` 알림과 감각 피드백 */
export const TAP_PATTERN: HapticEvent[] = [{ type: 'transient', timeMs: 0, intensity: 0.4, sharpness: 0.5 }];

export const TOGGLE_PATTERN: HapticEvent[] = [{ type: 'transient', timeMs: 0, intensity: 0.7, sharpness: 0.5 }];
