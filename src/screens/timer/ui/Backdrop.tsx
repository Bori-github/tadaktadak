import { Atlas, Skia, useColorBuffer, useRSXformBuffer, useRectBuffer } from '@shopify/react-native-skia';
import { memo, useMemo, type ComponentType } from 'react';

import { GLINT_COUNT, GLINT_STEP_MS, glintPositions, hillBaseline, hillDots, isGlintLit } from '../lib/hill';
import { FLAKE_COUNT, createFlakes, flakePosition } from '../lib/snow';
import { useBackdropElapsed } from '../model/backdrop';
import { useDisplayedTheme, type ThemeId } from '@/entities/theme';
import { DOT_SAMPLING, drawPlacedDots, drawSprites, packSprites } from '@/shared/lib';

type BackdropProps = {
  width: number;
  height: number;
  scale: number;
  dotSize: number;
  dialBottomY: number;
  isAnimating: boolean;
};

/** 파티클 격자. f 눈송이, l 반짝임 점등, d 반짝임 소등. 눈송이 알파는 `colors`로 적용 */
const PARTICLE_GRIDS = [['f'], ['l'], ['d']];
const PARTICLE_COLORS: Record<string, string> = { f: '#dfe8f5', l: '#f2f6ff', d: '#5a6a92' };
const PACKED_PARTICLES = packSprites(PARTICLE_GRIDS);
const particleLeft = (index: number) => PACKED_PARTICLES.boxes[index]?.left ?? 0;
const LIT_GLINT_LEFT = particleLeft(1);
const DIM_GLINT_LEFT = particleLeft(2);
const FLAKE_SPRITES = Array.from({ length: FLAKE_COUNT }, () => Skia.XYWHRect(particleLeft(0), 0, 1, 1));

const WinterBackdrop = ({ width, height, scale, dotSize, dialBottomY, isAnimating }: BackdropProps) => {
  const baseline = hillBaseline({ height, scale, dialBottomY });
  const hills = useMemo(() => drawPlacedDots(hillDots({ width, height, scale, dotSize, baseline }), dotSize), [width, height, scale, dotSize, baseline]);
  const particles = useMemo(() => drawSprites(PARTICLE_GRIDS, PACKED_PARTICLES, PARTICLE_COLORS), []);
  const flakes = useMemo(() => createFlakes({ width, height, scale }), [width, height, scale]);
  const glintTransforms = useMemo(
    () => glintPositions({ width, scale, dotSize, baseline }).map(({ x, y }) => Skia.RSXform(dotSize, 0, x * dotSize, y * dotSize)),
    [width, scale, dotSize, baseline],
  );

  const elapsed = useBackdropElapsed(isAnimating);

  const flakeTransforms = useRSXformBuffer(FLAKE_COUNT, (transform, index) => {
    'worklet';
    const flake = flakes[index];

    if (flake === undefined) {
      transform.set(0, 0, 0, 0);
      return;
    }

    const { x, y } = flakePosition(flake, elapsed.value / 1000);
    transform.set(flake.isBig ? dotSize * 2 : dotSize, 0, Math.round(x / dotSize) * dotSize, Math.round(y / dotSize) * dotSize);
  });

  const flakeColors = useColorBuffer(FLAKE_COUNT, (color, index) => {
    'worklet';
    color[0] = 1;
    color[1] = 1;
    color[2] = 1;
    color[3] = flakes[index]?.alpha ?? 0;
  });

  const glintSprites = useRectBuffer(GLINT_COUNT, (sprite, index) => {
    'worklet';
    sprite.setXYWH(isGlintLit(index, Math.floor(elapsed.value / GLINT_STEP_MS)) ? LIT_GLINT_LEFT : DIM_GLINT_LEFT, 0, 1, 1);
  });

  if (!hills || !particles) return null;

  return (
    <>
      <Atlas image={particles} sprites={FLAKE_SPRITES} transforms={flakeTransforms} colors={flakeColors} colorBlendMode="modulate" sampling={DOT_SAMPLING} antiAlias={false} />
      <Atlas image={hills.image} sprites={hills.sprites} transforms={hills.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
      <Atlas image={particles} sprites={glintSprites} transforms={glintTransforms} sampling={DOT_SAMPLING} antiAlias={false} />
    </>
  );
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
