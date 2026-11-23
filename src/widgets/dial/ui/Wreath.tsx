import { Atlas, Skia, type SkImage, type SkRect, type SkRSXform } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { DIAL_ITEM_STYLES } from '../config/items';
import { DOT_SAMPLING, drawDots, type ColoredDot } from '../lib/atlas';
import { wireDots } from '../lib/wire';
import { wreathDots } from '../lib/wreath';
import { useDisplayedTheme } from '@/entities/theme';

type WreathProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  settingMinutes: number;
};

const drawWreath = (dots: ColoredDot[], dotSize: number): { image: SkImage; sprites: SkRect[]; transforms: SkRSXform[] } | null => {
  if (dots.length === 0) return null;

  let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const { x, y } of dots) {
    [left, top, right, bottom] = [Math.min(left, x), Math.min(top, y), Math.max(right, x), Math.max(bottom, y)];
  }

  const image = drawDots(
    right - left + 1,
    bottom - top + 1,
    dots.map((dot) => ({ ...dot, x: dot.x - left, y: dot.y - top })),
  );
  if (!image) return null;

  return {
    image,
    sprites: [Skia.XYWHRect(0, 0, image.width(), image.height())],
    transforms: [Skia.RSXform(dotSize, 0, left * dotSize, top * dotSize)],
  };
};

export const Wreath = memo(({ centerX, centerY, radius, dotSize, settingMinutes }: WreathProps) => {
  // `useSyncExternalStore` 기반이라 Skia `Canvas` 내부에서도 조회 가능
  const { hasWreath } = DIAL_ITEM_STYLES[useDisplayedTheme()];
  const drawn = useMemo(() => (hasWreath ? drawWreath(wreathDots({ centerX, centerY, radius, dotSize }), dotSize) : null), [hasWreath, centerX, centerY, radius, dotSize]);
  const wire = useMemo(
    () => (hasWreath ? drawWreath(wireDots(settingMinutes, { centerX, centerY, radius, dotSize }), dotSize) : null),
    [hasWreath, settingMinutes, centerX, centerY, radius, dotSize],
  );

  if (!drawn) return null;

  return (
    <>
      <Atlas image={drawn.image} sprites={drawn.sprites} transforms={drawn.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
      {wire ? <Atlas image={wire.image} sprites={wire.sprites} transforms={wire.transforms} sampling={DOT_SAMPLING} antiAlias={false} /> : null}
    </>
  );
});

Wreath.displayName = 'Wreath';
