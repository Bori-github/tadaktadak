import { Atlas, Skia, type SkImage } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { DIAL_ITEM_STYLES } from '../config/items';
import { DOT_SAMPLING, drawDots, type ColoredDot } from '../lib/atlas';
import { wreathDots } from '../lib/wreath';
import { useDisplayedTheme } from '@/entities/theme';

type WreathProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
};

const drawWreath = (dots: ColoredDot[]): { image: SkImage; left: number; top: number } | null => {
  if (dots.length === 0) return null;

  const left = Math.min(...dots.map((dot) => dot.x));
  const top = Math.min(...dots.map((dot) => dot.y));
  const width = Math.max(...dots.map((dot) => dot.x)) - left + 1;
  const height = Math.max(...dots.map((dot) => dot.y)) - top + 1;
  const image = drawDots(
    width,
    height,
    dots.map((dot) => ({ ...dot, x: dot.x - left, y: dot.y - top })),
  );

  return image ? { image, left, top } : null;
};

export const Wreath = memo(({ centerX, centerY, radius, dotSize }: WreathProps) => {
  // `useSyncExternalStore` 기반이라 Skia `Canvas` 내부에서도 조회 가능
  const { hasWreath } = DIAL_ITEM_STYLES[useDisplayedTheme()];
  const drawn = useMemo(() => (hasWreath ? drawWreath(wreathDots({ centerX, centerY, radius, dotSize })) : null), [hasWreath, centerX, centerY, radius, dotSize]);

  if (!drawn) return null;

  const { image, left, top } = drawn;

  return (
    <Atlas
      image={image}
      sprites={[Skia.XYWHRect(0, 0, image.width(), image.height())]}
      transforms={[Skia.RSXform(dotSize, 0, left * dotSize, top * dotSize)]}
      sampling={DOT_SAMPLING}
      antiAlias={false}
    />
  );
});

Wreath.displayName = 'Wreath';
