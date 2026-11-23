import { Atlas } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { DOT_SAMPLING, drawPlacedDots } from '../lib/atlas';
import { wireDots } from '../lib/wire';

type WireProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  settingMinutes: number;
};

export const Wire = memo(({ centerX, centerY, radius, dotSize, settingMinutes }: WireProps) => {
  const drawn = useMemo(() => drawPlacedDots(wireDots(settingMinutes, { centerX, centerY, radius, dotSize }), dotSize), [settingMinutes, centerX, centerY, radius, dotSize]);

  if (!drawn) return null;

  return <Atlas image={drawn.image} sprites={drawn.sprites} transforms={drawn.transforms} sampling={DOT_SAMPLING} antiAlias={false} />;
});

Wire.displayName = 'Wire';
