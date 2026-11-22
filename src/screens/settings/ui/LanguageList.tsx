import { memo } from 'react';

import { CheckRow } from './CheckRow';

import { selectLanguage, SUPPORTED_LANGUAGES, translate, useLanguage, useSelectedLanguage, type Language } from '@/entities/language';

/** `null`: 시스템 언어 */
const LANGUAGE_OPTIONS: readonly (Language | null)[] = [null, ...SUPPORTED_LANGUAGES];

type LanguageListProps = {
  dotSize: number;
};

export const LanguageList = memo(({ dotSize }: LanguageListProps) => {
  const language = useLanguage();
  const selected = useSelectedLanguage();

  return (
    <>
      {LANGUAGE_OPTIONS.map((option) => (
        <CheckRow
          key={option ?? 'system'}
          dotSize={dotSize}
          name={option === null ? translate('language.system', language) : translate('language.name', option)}
          description={option === null ? translate('language.systemDescription', language) : undefined}
          checked={option === selected}
          testID={`language-${option ?? 'system'}`}
          onPress={() => selectLanguage(option)}
        />
      ))}
    </>
  );
});

LanguageList.displayName = 'LanguageList';
