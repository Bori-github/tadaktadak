import { useSyncExternalStore } from 'react';

import { loadAmbientSoundEnabled, saveAmbientSoundEnabled } from '../api/storage';

let isEnabled = false;
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
 * 기기에 저장된 배경음 사용 여부를 읽어 적용. 앱 시작 시 1회 호출
 *
 * @returns 읽기가 끝나면 이행하는 프로미스
 */
export const restoreAmbientSoundEnabled = async (): Promise<void> => {
  const before = isEnabled;
  // 읽기 실패 시 기본값인 꺼짐 유지
  const saved = await loadAmbientSoundEnabled().catch(() => false);

  // 읽는 도중 사용자가 변경한 값은 저장값으로 덮지 않음
  if (isEnabled !== before) return;

  applyEnabled(saved);
};

/**
 * 배경음 사용 여부를 적용하고 기기에 저장
 *
 * @returns 없음
 */
export const setAmbientSoundEnabled = (enabled: boolean): void => {
  applyEnabled(enabled);

  // 저장 실패 시 다음 실행은 기기에 남은 값으로 시작
  saveAmbientSoundEnabled(enabled).catch(() => {});
};

/**
 * 배경음 사용 여부 변경 시 리렌더링됨
 *
 * @returns 배경음 사용 여부가 켜져 있으면 true
 */
export const useAmbientSoundEnabled = (): boolean => useSyncExternalStore(subscribeEnabled, getEnabled);
