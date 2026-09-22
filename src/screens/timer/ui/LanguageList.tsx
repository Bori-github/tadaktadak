import { memo } from 'react';

import { LanguageRow } from './LanguageRow';

import { selectLanguage, SUPPORTED_LANGUAGES, translate, useLanguage, useSelectedLanguage, type Language } from '@/entities/language';

/** `null`: 시스템 언어 */
export const LANGUAGE_OPTIONS: readonly (Language | null)[] = [null, ...SUPPORTED_LANGUAGES];

type LanguageListProps = {
  dotSize: number;
};

export const LanguageList = memo(({ dotSize }: LanguageListProps) => {
  const language = useLanguage();
  const selected = useSelectedLanguage();

  return (
    <>
      {LANGUAGE_OPTIONS.map((option, index) => (
        <LanguageRow
          key={option ?? 'system'}
          index={index}
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
