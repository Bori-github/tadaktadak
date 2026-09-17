import 'intl-pluralrules';
import { useMemo } from 'react';
import { useLocales, type Locale } from 'expo-localization';
import { init, t, use as registerPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from '../translations/en-US.json';
import koKR from '../translations/ko-KR.json';

export const SUPPORTED_LANGUAGES = ['en-US', 'ko-KR'] as const;

export type Language = (typeof SUPPORTED_LANGUAGES)[number];

const DEFAULT_LANGUAGE: Language = 'en-US';

const LANGUAGE_BY_CODE: Record<string, Language> = {
  en: 'en-US',
  ko: 'ko-KR',
};

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
 * OS 언어 설정이 바뀌면 다시 계산됨
 *
 * @returns 기기 언어에 맞는 지원 언어
 */
export const useLanguage = (): Language => {
  const locales = useLocales();

  return useMemo(() => pickLanguage(locales), [locales]);
};

/**
 * 전역 로케일 대신 호출마다 언어를 받음
 *
 * @param key - 번역 파일의 점으로 이은 키 경로
 * @returns 키 값에 대응하는 문구
 */
export const translate = (key: string, language: Language): string => t(key, { lng: language });
