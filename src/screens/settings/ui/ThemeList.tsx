import { memo } from 'react';

import { CheckRow } from './CheckRow';

import { translate, useLanguage } from '@/entities/language';
import { selectTheme, THEME_IDS, useDisplayedTheme } from '@/entities/theme';

type ThemeListProps = {
  dotSize: number;
};

export const ThemeList = memo(({ dotSize }: ThemeListProps) => {
  const language = useLanguage();
  const displayed = useDisplayedTheme();

  return (
    <>
      {THEME_IDS.map((id) => (
        <CheckRow key={id} dotSize={dotSize} name={translate(`theme.${id}`, language)} checked={id === displayed} testID={`theme-${id}`} onPress={() => selectTheme(id)} />
      ))}
    </>
  );
});

ThemeList.displayName = 'ThemeList';
