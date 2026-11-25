import { Atlas } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { wreathDots } from '../lib/wreath';
import { DOT_SAMPLING, drawPlacedDots } from '@/shared/lib';

type WreathProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
};

export const Wreath = memo(({ centerX, centerY, radius, dotSize }: WreathProps) => {
  const drawn = useMemo(() => drawPlacedDots(wreathDots({ centerX, centerY, radius, dotSize }), dotSize), [centerX, centerY, radius, dotSize]);

  if (!drawn) return null;

  return <Atlas image={drawn.image} sprites={drawn.sprites} transforms={drawn.transforms} sampling={DOT_SAMPLING} antiAlias={false} />;
});

Wreath.displayName = 'Wreath';
