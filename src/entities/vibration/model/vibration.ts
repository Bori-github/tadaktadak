import { useSyncExternalStore } from 'react';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { hapticPattern, type HapticEvent } from '@modules/haptic-pattern';

import { createStoredSetting } from '@/shared/lib';

/** 네이티브 모듈에 등록하는 이름. 앱이 쓰는 조작 진동이 하나뿐이라 부르는 쪽에서 고르지 않음 */
const PATTERN_NAME = 'tap';

/** `transient` 이벤트의 진동 시간(ms). `Vibration.vibrate`가 진폭을 받지 않아 진동 시간으로 세기 조절 */
const TRANSIENT_DURATION_MS = 5;

const ENABLED_KEY = 'vibrationEnabled';

/** `hapticPattern`이 `null`일 때 `playVibration`이 재생하는 패턴 */
let tapEvents: HapticEvent[] = [];

/**
 * `Vibration.vibrate`의 패턴 배열로 변환. `timeMs`가 같은 이벤트는 최대 진동 시간으로 병합
 *
 * @returns 대기 시간과 진동 시간(ms)이 교차하는 배열
 */
const toVibrationPattern = (events: HapticEvent[]): number[] => {
  const durationsByTime = new Map<number, number>();
  events.forEach((event) => {
    const duration = event.type === 'continuous' ? event.durationMs : TRANSIENT_DURATION_MS;
    durationsByTime.set(event.timeMs, Math.max(durationsByTime.get(event.timeMs) ?? 0, duration));
  });

  const pattern: number[] = [];
  let endMs = 0;
  [...durationsByTime]
    .sort(([a], [b]) => a - b)
    .forEach(([timeMs, durationMs]) => {
      pattern.push(timeMs - endMs, durationMs);
      endMs = timeMs + durationMs;
    });

  return pattern;
};

/**
 * `hapticPattern`이 `null`인 Android·Expo Go 빌드의 진동 재생. 네이티브 모듈이 iOS 전용이라 `Vibration.vibrate`로 대체
 *
 * @returns 없음
 */
const vibrate = (events: HapticEvent[]): void => {
  Vibration.vibrate(toVibrationPattern(events));
};

const enabledSetting = createStoredSetting({
  initialValue: true,
  // 저장값 없음(`null`)은 켜짐으로 처리
  load: async () => (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false',
  save: async (enabled: boolean) => AsyncStorage.setItem(ENABLED_KEY, String(enabled)),
});

/**
 * 기기에 저장된 진동 사용 여부를 읽어 적용. 앱 시작 시 1회 호출
 *
 * @returns 읽기가 끝나면 이행하는 프로미스
 */
export const restoreVibrationEnabled = (): Promise<void> => enabledSetting.restore();

/**
 * 진동 사용 여부를 적용하고 기기에 저장
 *
 * @returns 없음
 */
export const setVibrationEnabled = (enabled: boolean): void => {
  enabledSetting.set(enabled);
};

/**
 * 진동 사용 여부 변경 시 리렌더링됨
 *
 * @returns 진동 사용 여부가 켜져 있으면 true
 */
export const useVibrationEnabled = (): boolean => useSyncExternalStore(enabledSetting.subscribe, enabledSetting.get);

/** 조작 진동 패턴을 등록 */
export const prepareVibration = (events: HapticEvent[]): void => {
  tapEvents = events;
  // 등록하지 않았거나 실패하면 진동이 울리지 않음
  hapticPattern?.prepareAsync(PATTERN_NAME, events).catch(() => {});
};

/** 등록한 패턴을 재생 */
export const playVibration = (): void => {
  if (!enabledSetting.get()) return;

  if (hapticPattern) hapticPattern.play(PATTERN_NAME);
  else vibrate(tapEvents);
};

/** 진동 사용 여부와 관계없이 `events` 패턴 1회 재생 */
export const previewVibration = (events: HapticEvent[]): void => {
  // 재생 실패 시 피드백 진동만 생략
  if (hapticPattern) hapticPattern.playAsync(events).catch(() => {});
  else vibrate(events);
};

/** 진동이 잇따르는 동안 자동 종료를 막음 */
export const holdVibration = (): void => {
  if (!enabledSetting.get()) return;

  // 실패하면 자동 종료를 막지 않아 다음 진동의 시작이 늦어짐
  hapticPattern?.holdAsync().catch(() => {});
};

/** 막아 둔 자동 종료를 되돌림 */
export const releaseVibration = (): void => {
  // 진동 사용 여부를 끄기 전에 `holdVibration`으로 막아 둔 자동 종료도 해제해야 해서 사용 여부 확인 생략
  hapticPattern?.release();
};

/**
 * @returns 진동 사용 여부가 켜져 있고, 네이티브 모듈이 없거나 기기가 햅틱을 지원하면 true
 */
export const canVibrate = (): boolean => enabledSetting.get() && (hapticPattern === null || hapticPattern.supportsHaptics);

/** `events` 패턴 1회 재생 */
export const playVibrationPattern = (events: HapticEvent[]): void => {
  if (!enabledSetting.get()) return;

  if (!hapticPattern) {
    vibrate(events);
    return;
  }

  // 인자의 Swift 타입 변환 실패 시 네이티브 대체 진동이 실행되지 않아 `Vibration.vibrate()`로 대체
  hapticPattern.playAsync(events).catch(() => Vibration.vibrate());
};
