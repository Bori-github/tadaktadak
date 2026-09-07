import { NativeModule, requireOptionalNativeModule } from 'expo';

/**
 * `intensity`와 `sharpness`는 0.0~1.0. `timeMs`는 패턴 시작부터의 상대 시각
 *
 * @see https://developer.apple.com/documentation/corehaptics/chhapticevent
 */
export type HapticEvent =
  { type: 'transient'; timeMs: number; intensity: number; sharpness: number } | { type: 'continuous'; timeMs: number; durationMs: number; intensity: number; sharpness: number };

declare class HapticPatternModule extends NativeModule {
  isSupported(): boolean;
  playAsync(events: HapticEvent[]): Promise<void>;
}

export const hapticPattern = requireOptionalNativeModule<HapticPatternModule>('HapticPattern');
