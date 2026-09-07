import { NativeModule, requireOptionalNativeModule } from 'expo';

type HapticEventBase = {
  /** 패턴이 시작한 시각을 0으로 본 상대 시각 */
  timeMs: number;
  /** 진동 세기. 0.0이 최대 감쇠, 1.0이 감쇠 없음 */
  intensity: number;
  /** 진동 날카로움. 0.0이 가장 덜 날카롭고 1.0이 가장 날카로움 */
  sharpness: number;
};

/** @see https://developer.apple.com/documentation/corehaptics/chhapticevent */
export type HapticEvent =
  | (HapticEventBase & {
      /** 길이 없이 한 번 치고 끝나는 진동 */
      type: 'transient';
    })
  | (HapticEventBase & {
      /** 길이만큼 이어지는 진동 */
      type: 'continuous';
      /** 진동이 이어지는 시간. Core Haptics는 `transient`에서 이 값을 보지 않음 */
      durationMs: number;
    });

declare class HapticPatternModule extends NativeModule {
  playAsync(events: HapticEvent[]): Promise<void>;
}

export const hapticPattern = requireOptionalNativeModule<HapticPatternModule>('HapticPattern');
