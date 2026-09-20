import { useSyncExternalStore } from 'react';
import { useLocales } from 'expo-localization';

import { clearLanguage, loadLanguage, saveLanguage } from '../api/storage';

import { pickLanguage, type Language } from './language';

let selectedLanguage: Language | null = null;
const listeners = new Set<() => void>();

const subscribeSelectedLanguage = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getSelectedLanguage = (): Language | null => selectedLanguage;

const setSelectedLanguage = (language: Language | null): void => {
  selectedLanguage = language;
  listeners.forEach((listener) => {
    listener();
  });
};

/**
 * 기기에 저장된 선택한 언어를 읽어 적용. 앱 시작 때 한 번 호출
 *
 * @returns 읽기가 끝나면 이행하는 프로미스
 */
export const restoreLanguage = async (): Promise<void> => {
  const before = selectedLanguage;
  // 읽지 못하면 시스템 언어를 따름
  const saved = await loadLanguage().catch(() => null);

  // 읽는 동안 사용자가 선택했으면 선택한 언어를 유지
  if (selectedLanguage !== before) return;

  setSelectedLanguage(saved);
};

/**
 * 선택한 언어를 적용하고 기기에 저장. `null`이면 시스템 언어를 따름
 *
 * @returns 없음
 */
export const selectLanguage = (language: Language | null): void => {
  setSelectedLanguage(language);

  // 실패하면 다음 실행에서 기기에 남은 값으로 시작함
  const stored = language === null ? clearLanguage() : saveLanguage(language);
  stored.catch(() => {});
};

/**
 * OS 언어 설정이 바뀌면 다시 계산됨
 *
 * @returns 선택한 언어. 없으면 시스템 언어에 맞는 지원 언어
 */
export const useLanguage = (): Language => {
  const locales = useLocales();
  const selected = useSyncExternalStore(subscribeSelectedLanguage, getSelectedLanguage);

  return selected ?? pickLanguage(locales);
};

/**
 * @returns 선택한 언어. 선택한 적이 없으면 `null`
 */
export const useSelectedLanguage = (): Language | null => useSyncExternalStore(subscribeSelectedLanguage, getSelectedLanguage);
