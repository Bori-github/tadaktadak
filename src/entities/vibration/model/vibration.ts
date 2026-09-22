import { Vibration } from 'react-native';

import { hapticPattern, type HapticEvent } from '@modules/haptic-pattern';

/** 네이티브 모듈에 등록하는 이름. 앱이 쓰는 조작 진동이 하나뿐이라 부르는 쪽에서 고르지 않음 */
const PATTERN_NAME = 'tap';

/** 조작 진동 패턴을 등록 */
export const prepareVibration = (events: HapticEvent[]): void => {
  // 등록하지 않았거나 실패하면 진동이 울리지 않음
  hapticPattern?.prepareAsync(PATTERN_NAME, events).catch(() => {});
};

/** 등록한 패턴을 재생. 네이티브 모듈이 없는 빌드에서는 진동이 울리지 않음 */
export const playVibration = (): void => {
  hapticPattern?.play(PATTERN_NAME);
};

/** 진동이 잇따르는 동안 자동 종료를 막음 */
export const holdVibration = (): void => {
  // 실패하면 자동 종료를 막지 않아 다음 진동의 시작이 늦어짐
  hapticPattern?.holdAsync().catch(() => {});
};

/** 막아 둔 자동 종료를 되돌림 */
export const releaseVibration = (): void => {
  hapticPattern?.release();
};

/**
 * @returns 기기가 햅틱을 지원하면 true
 */
export const canVibrate = (): boolean => hapticPattern?.supportsHaptics === true;

/** `events` 패턴 1회 재생 */
export const playVibrationPattern = (events: HapticEvent[]): void => {
  // 네이티브 모듈 미포함 빌드에서 `hapticPattern`은 `null`. 재생 생략
  // 인자의 Swift 타입 변환 실패 시 네이티브 대체 진동이 실행되지 않아 `Vibration.vibrate()`로 대체
  hapticPattern?.playAsync(events).catch(() => Vibration.vibrate());
};
