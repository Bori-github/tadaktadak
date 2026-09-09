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

/** 진동이 잇따르는 동안 하드웨어를 켜 둠 */
export const holdVibration = (): void => {
  // 실패하면 유휴에 하드웨어가 꺼져 다음 진동의 시작이 늦어짐
  hapticPattern?.holdAsync().catch(() => {});
};

/** 켜 둔 하드웨어가 유휴에 꺼짐 */
export const releaseVibration = (): void => {
  hapticPattern?.release();
};
