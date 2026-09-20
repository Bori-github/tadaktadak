import { type Locale } from 'expo-localization';
import { init, t, use as registerPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from '../config/translations/en-US.json';
import koKR from '../config/translations/ko-KR.json';

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

/**
 * 번역 리소스를 i18next에 등록. `translate` 호출 전 한 번 실행
 *
 * @returns 없음
 */
export const initLocalization = (): void => {
  registerPlugin(initReactI18next);

  init({
    resources: RESOURCES,
    lng: DEFAULT_LANGUAGE,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: [...SUPPORTED_LANGUAGES],
    interpolation: { escapeValue: false },
  });
};

/**
 * @param locales - 시스템 설정의 선호 순서대로 전달되는 언어 목록
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

/**
 * 전역 로케일 대신 호출마다 언어를 받음
 *
 * @returns 키 값에 대응하는 문구
 */
export const translate = (key: TranslationKey, language: Language): string => t(key, { lng: language });
