import { hapticPattern, type HapticEvent } from '@modules/haptic-pattern';

/** 미리 만들어 둔 진동 패턴의 이름 */
export type VibrationName = 'snap';

/** 패턴을 이름에 붙여 등록 */
export const prepareVibration = (name: VibrationName, events: HapticEvent[]): void => {
  // 등록하지 않은 이름이거나 실패하면 그 이름의 진동이 울리지 않음
  hapticPattern?.prepareAsync(name, events).catch(() => {});
};

/** 미리 만들어 둔 패턴을 재생. 네이티브 모듈이 없는 빌드에서는 진동이 울리지 않음 */
export const vibrate = (name: VibrationName): void => {
  hapticPattern?.play(name);
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
