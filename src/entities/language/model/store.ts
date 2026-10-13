import { useSyncExternalStore } from 'react';
import { useLocales } from 'expo-localization';

import { clearLanguage, loadLanguage, saveLanguage } from '../api/storage';

import { pickLanguage, type Language } from './language';

import { createStoredSetting } from '@/shared/lib';

const selectedLanguageSetting = createStoredSetting<Language | null>({
  // `null`은 시스템 언어 사용
  initialValue: null,
  load: loadLanguage,
  save: async (language) => (language === null ? clearLanguage() : saveLanguage(language)),
});

/**
 * 기기에 저장된 선택한 언어를 읽어 적용. 앱 시작 때 한 번 호출
 *
 * @returns 읽기가 끝나면 이행하는 프로미스
 */
export const restoreLanguage = (): Promise<void> => selectedLanguageSetting.restore();

/**
 * 선택한 언어를 적용하고 기기에 저장. `null`이면 시스템 언어를 따름
 *
 * @returns 없음
 */
export const selectLanguage = (language: Language | null): void => {
  selectedLanguageSetting.set(language);
};

/**
 * OS 언어 설정이 바뀌면 다시 계산됨
 *
 * @returns 선택한 언어. 없으면 시스템 언어에 맞는 지원 언어
 */
export const useLanguage = (): Language => {
  const locales = useLocales();
  const selected = useSyncExternalStore(selectedLanguageSetting.subscribe, selectedLanguageSetting.get);

  return selected ?? pickLanguage(locales);
};

/**
 * @returns 선택한 언어. 선택한 적이 없으면 `null`
 */
export const useSelectedLanguage = (): Language | null => useSyncExternalStore(selectedLanguageSetting.subscribe, selectedLanguageSetting.get);
