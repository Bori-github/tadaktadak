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
  /** 이 기기가 패턴 재생을 지원하는지. iPad는 `false`이고 대체 진동도 울리지 않음 */
  supportsHaptics: boolean;
  playAsync(events: HapticEvent[]): Promise<void>;
  /** 반복 재생할 패턴의 이름을 등록 */
  prepareAsync(name: string, events: HapticEvent[]): Promise<void>;
  /** 등록된 패턴을 재생. 등록되지 않은 패턴은 동작하지 않음 */
  play(name: string): void;
  /** `release`를 호출할 때까지 자동 종료를 막음 */
  holdAsync(): Promise<void>;
  /** `holdAsync`로 막아 둔 자동 종료를 되돌림 */
  release(): void;
}

export const hapticPattern = requireOptionalNativeModule<HapticPatternModule>('HapticPattern');
