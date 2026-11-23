import { Atlas, Skia, type SkImage } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { DIAL_ITEM_STYLES } from '../config/items';
import { DOT_SAMPLING } from '../lib/atlas';
import { wreathDots, type WreathDot } from '../lib/wreath';
import { useDisplayedTheme } from '@/entities/theme';

type WreathProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
};

/** 도트 1개를 1px로 그린 이미지와 왼쪽 위 도트 좌표 */
const drawDots = (dots: WreathDot[]): { image: SkImage; left: number; top: number } | null => {
  if (dots.length === 0) return null;

  const left = Math.min(...dots.map((dot) => dot.x));
  const top = Math.min(...dots.map((dot) => dot.y));
  const surface = Skia.Surface.Make(Math.max(...dots.map((dot) => dot.x)) - left + 1, Math.max(...dots.map((dot) => dot.y)) - top + 1);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();

  // `Surface.Make` 표면이 초기화되지 않아 이전 내용 노출 방지
  canvas.clear(Skia.Color('transparent'));

  for (const dot of dots) {
    paint.setColor(Skia.Color(dot.color));
    canvas.drawRect(Skia.XYWHRect(dot.x - left, dot.y - top, 1, 1), paint);
  }

  surface.flush();

  return { image: surface.makeImageSnapshot(), left, top };
};

export const Wreath = memo(({ centerX, centerY, radius, dotSize }: WreathProps) => {
  // `useSyncExternalStore` 기반이라 Skia `Canvas` 내부에서도 조회 가능
  const { hasWreath } = DIAL_ITEM_STYLES[useDisplayedTheme()];
  const drawn = useMemo(() => (hasWreath ? drawDots(wreathDots({ centerX, centerY, radius, dotSize })) : null), [hasWreath, centerX, centerY, radius, dotSize]);

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
