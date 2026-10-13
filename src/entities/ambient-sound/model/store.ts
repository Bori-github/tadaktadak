import { useSyncExternalStore } from 'react';

import { loadAmbientSoundEnabled, saveAmbientSoundEnabled } from '../api/storage';

import { createStoredSetting } from '@/shared/lib';

const enabledSetting = createStoredSetting({
  initialValue: false,
  load: loadAmbientSoundEnabled,
  save: saveAmbientSoundEnabled,
});

/**
 * 기기에 저장된 배경음 사용 여부를 읽어 적용. 앱 시작 시 1회 호출
 *
 * @returns 읽기가 끝나면 이행하는 프로미스
 */
export const restoreAmbientSoundEnabled = (): Promise<void> => enabledSetting.restore();

/**
 * 배경음 사용 여부를 적용하고 기기에 저장
 *
 * @returns 없음
 */
export const setAmbientSoundEnabled = (enabled: boolean): void => {
  enabledSetting.set(enabled);
};

/**
 * 배경음 사용 여부 변경 시 리렌더링됨
 *
 * @returns 배경음 사용 여부가 켜져 있으면 true
 */
export const useAmbientSoundEnabled = (): boolean => useSyncExternalStore(enabledSetting.subscribe, enabledSetting.get);
