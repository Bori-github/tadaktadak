import { Atlas } from '@shopify/react-native-skia';
import { memo, useMemo, type ComponentType } from 'react';

import { hillBaseline, hillDots } from '../lib/hill';
import { useDisplayedTheme, type ThemeId } from '@/entities/theme';
import { DOT_SAMPLING, drawPlacedDots } from '@/shared/lib';

type BackdropProps = {
  width: number;
  height: number;
  scale: number;
  dotSize: number;
  dialBottomY: number;
};

const WinterBackdrop = ({ width, height, scale, dotSize, dialBottomY }: BackdropProps) => {
  const drawn = useMemo(() => {
    const baseline = hillBaseline({ height, scale, dialBottomY });
    return drawPlacedDots(hillDots({ width, height, scale, dotSize, baseline }), dotSize);
  }, [width, height, scale, dotSize, dialBottomY]);

  if (!drawn) return null;

  return <Atlas image={drawn.image} sprites={drawn.sprites} transforms={drawn.transforms} sampling={DOT_SAMPLING} antiAlias={false} />;
};

const BACKDROPS: Record<ThemeId, ComponentType<BackdropProps> | null> = {
  campfire: null,
  winter: WinterBackdrop,
};

/** 시계판 아래 테마 배경 */
export const Backdrop = memo((props: BackdropProps) => {
  // `useSyncExternalStore` 기반이라 Skia `Canvas` 내부에서도 조회 가능
  const ThemeBackdrop = BACKDROPS[useDisplayedTheme()];

  return ThemeBackdrop ? <ThemeBackdrop {...props} /> : null;
});

Backdrop.displayName = 'Backdrop';
