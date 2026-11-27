import { memo } from 'react';

import { translate, useLanguage } from '@/entities/language';
import { selectTheme, THEME_IDS, useDisplayedTheme } from '@/entities/theme';

import { DotModalCheckRow } from '@/shared/ui/dot-modal';

type ThemeListProps = {
  dotSize: number;
};

export const ThemeList = memo(({ dotSize }: ThemeListProps) => {
  const language = useLanguage();
  const displayed = useDisplayedTheme();

  return (
    <>
      {THEME_IDS.map((id) => (
        <DotModalCheckRow key={id} dotSize={dotSize} name={translate(`theme.${id}`, language)} checked={id === displayed} testID={`theme-${id}`} onPress={() => selectTheme(id)} />
      ))}
    </>
  );
});

ThemeList.displayName = 'ThemeList';
