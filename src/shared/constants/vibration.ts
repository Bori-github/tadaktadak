import { type HapticEvent } from '@modules/haptic-pattern';

/** 타이머 설정 변경 시 진동 패턴 */
export const SNAP_PATTERN: HapticEvent[] = [{ type: 'transient', timeMs: 0, intensity: 0.4, sharpness: 0.5 }];
