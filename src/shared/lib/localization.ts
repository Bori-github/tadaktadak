import { useMemo, useSyncExternalStore } from 'react';
import { useLocales, type Locale } from 'expo-localization';
import { init, t, use as registerPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { loadLanguage, saveLanguage } from '@/shared/api';

import enUS from '../translations/en-US.json';
import koKR from '../translations/ko-KR.json';

const SUPPORTED_LANGUAGES = ['en-US', 'ko-KR'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const DEFAULT_LANGUAGE: Language = 'en-US';

const LANGUAGE_BY_CODE: Record<string, Language> = Object.fromEntries(SUPPORTED_LANGUAGES.map((language) => [language.replace(/-.*$/, ''), language]));

type KeyPath<TResource> = {
  [Key in keyof TResource & string]: TResource[Key] extends string ? Key : `${Key}.${KeyPath<TResource[Key]>}`;
}[keyof TResource & string];

type TranslationKey = KeyPath<typeof enUS>;

const RESOURCES = {
  'en-US': { translation: enUS },
  'ko-KR': { translation: koKR },
} satisfies Record<Language, { translation: typeof enUS }>;

registerPlugin(initReactI18next);

init({
  resources: RESOURCES,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: [...SUPPORTED_LANGUAGES],
  interpolation: { escapeValue: false },
});

/**
 * @param locales - 기기 설정의 선호 순서대로 전달되는 언어 목록
 * @returns 지원 목록과 처음 일치하는 언어. 없으면 `en-US`
 */
export const pickLanguage = (locales: Pick<Locale, 'languageCode'>[]): Language => {
  for (const { languageCode } of locales) {
    if (languageCode === null) continue;

    const language = LANGUAGE_BY_CODE[languageCode];
    if (language !== undefined) return language;
  }

  return DEFAULT_LANGUAGE;
};

/**
 * @param saved - 기기에 저장된 언어 태그
 * @returns 지원 언어면 그 언어. 저장값이 없거나 지원 목록에 없으면 `null`
 */
export const parseLanguage = (saved: string | null): Language | null => SUPPORTED_LANGUAGES.find((language) => language === saved) ?? null;

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
  // 읽지 못하면 기기 언어를 따름
  const saved = parseLanguage(await loadLanguage().catch(() => null));

  // 읽는 동안 사용자가 선택했으면 선택한 언어를 유지
  if (selectedLanguage !== before) return;

  setSelectedLanguage(saved);
};

/**
 * 선택한 언어를 적용하고 기기에 저장
 *
 * @returns 없음
 */
export const selectLanguage = (language: Language): void => {
  setSelectedLanguage(language);
  // 실패하면 다음 실행에서 기기에 남은 값으로 시작함
  saveLanguage(language).catch(() => {});
};

/**
 * OS 언어 설정이 바뀌면 다시 계산됨
 *
 * @returns 선택한 언어. 없으면 기기 언어에 맞는 지원 언어
 */
export const useLanguage = (): Language => {
  const locales = useLocales();
  const selected = useSyncExternalStore(subscribeSelectedLanguage, getSelectedLanguage);

  return useMemo(() => selected ?? pickLanguage(locales), [selected, locales]);
};

/**
 * 전역 로케일 대신 호출마다 언어를 받음
 *
 * @returns 키 값에 대응하는 문구
 */
export const translate = (key: TranslationKey, language: Language): string => t(key, { lng: language });
