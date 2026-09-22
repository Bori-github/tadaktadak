import { useSyncExternalStore } from 'react';
import { Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { hapticPattern, type HapticEvent } from '@modules/haptic-pattern';

/** 네이티브 모듈에 등록하는 이름. 앱이 쓰는 조작 진동이 하나뿐이라 부르는 쪽에서 고르지 않음 */
const PATTERN_NAME = 'tap';

const ENABLED_KEY = 'vibrationEnabled';

let isEnabled = true;
const listeners = new Set<() => void>();

const subscribeEnabled = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getEnabled = (): boolean => isEnabled;

const applyEnabled = (enabled: boolean): void => {
  isEnabled = enabled;
  listeners.forEach((listener) => {
    listener();
  });
};

/**
 * 기기에 저장된 진동 사용 여부를 읽어 적용. 앱 시작 시 1회 호출
 *
 * @returns 읽기가 끝나면 이행하는 프로미스
 */
export const restoreVibrationEnabled = async (): Promise<void> => {
  const before = isEnabled;
  // 읽기 실패 시 기본값인 켜짐 유지
  const saved = await AsyncStorage.getItem(ENABLED_KEY).catch(() => null);

  // 읽는 도중 사용자가 변경한 값은 저장값으로 덮지 않음
  if (isEnabled !== before) return;

  applyEnabled(saved !== 'false');
};

/**
 * 진동 사용 여부를 적용하고 기기에 저장
 *
 * @returns 없음
 */
export const setVibrationEnabled = (enabled: boolean): void => {
  applyEnabled(enabled);

  // 저장 실패 시 다음 실행은 기기에 남은 값으로 시작
  AsyncStorage.setItem(ENABLED_KEY, String(enabled)).catch(() => {});
};

/**
 * 진동 사용 여부 변경 시 리렌더링됨
 *
 * @returns 진동 사용 여부가 켜져 있으면 true
 */
export const useVibrationEnabled = (): boolean => useSyncExternalStore(subscribeEnabled, getEnabled);

/** 조작 진동 패턴을 등록 */
export const prepareVibration = (events: HapticEvent[]): void => {
  // 등록하지 않았거나 실패하면 진동이 울리지 않음
  hapticPattern?.prepareAsync(PATTERN_NAME, events).catch(() => {});
};

/** 등록한 패턴을 재생. 네이티브 모듈이 없는 빌드에서는 진동이 울리지 않음 */
export const playVibration = (): void => {
  if (!isEnabled) return;

  hapticPattern?.play(PATTERN_NAME);
};

/** 진동 사용 여부와 관계없이 `events` 패턴 1회 재생 */
export const previewVibration = (events: HapticEvent[]): void => {
  // 재생 실패 시 피드백 진동만 생략
  hapticPattern?.playAsync(events).catch(() => {});
};

/** 진동이 잇따르는 동안 자동 종료를 막음 */
export const holdVibration = (): void => {
  if (!isEnabled) return;

  // 실패하면 자동 종료를 막지 않아 다음 진동의 시작이 늦어짐
  hapticPattern?.holdAsync().catch(() => {});
};

/** 막아 둔 자동 종료를 되돌림 */
export const releaseVibration = (): void => {
  // 진동 사용 여부를 끄기 전에 `holdVibration`으로 막아 둔 자동 종료도 해제해야 해서 사용 여부 확인 생략
  hapticPattern?.release();
};

/**
 * @returns 기기가 햅틱을 지원하고 진동 사용 여부가 켜져 있으면 true
 */
export const canVibrate = (): boolean => isEnabled && hapticPattern?.supportsHaptics === true;

/** `events` 패턴 1회 재생 */
export const playVibrationPattern = (events: HapticEvent[]): void => {
  if (!isEnabled) return;

  // 네이티브 모듈 미포함 빌드에서 `hapticPattern`은 `null`. 재생 생략
  // 인자의 Swift 타입 변환 실패 시 네이티브 대체 진동이 실행되지 않아 `Vibration.vibrate()`로 대체
  hapticPattern?.playAsync(events).catch(() => Vibration.vibrate());
};
