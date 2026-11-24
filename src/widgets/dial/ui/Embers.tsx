import { Atlas, Skia, TileMode, useColorBuffer, useRSXformBuffer, useRectBuffer, type SkImage } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo, useState } from 'react';
import { useDerivedValue } from 'react-native-reanimated';

import { DOT_SAMPLING, SOFT_SAMPLING } from '../lib/atlas';
import { getBloomGradient } from '../lib/bloom';
import { EMBER_COLOR_KEYS, EMBER_COUNT, EMBER_GLOW_ALPHA, EMBER_GLOW_RADIUS, emberAt, emberColorIndex, spawnEmbers, type Ember } from '../lib/ember';
import { useCompletedEffectElapsed } from '../model/ember';
import { DOT_SIZE } from '@/shared/constants';
import { type Palette } from '@/shared/lib';

type EmbersProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  effectStartedAt: number;
  palette: Palette;
};

/** 잔광 텍스처 반지름 (px) */
const GLOW_TEXTURE_RADIUS = 8;

const GLOW_SPRITE = Skia.XYWHRect(EMBER_COLOR_KEYS.length, 0, GLOW_TEXTURE_RADIUS * 2, GLOW_TEXTURE_RADIUS * 2);

/** 불티 색마다 도트 하나와 잔광 한 장을 담은 아틀라스 */
const drawEmbers = (palette: Palette): SkImage | null => {
  const surface = Skia.Surface.Make(EMBER_COLOR_KEYS.length + GLOW_TEXTURE_RADIUS * 2, GLOW_TEXTURE_RADIUS * 2);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();

  canvas.clear(Skia.Color('transparent'));

  for (const [index, key] of EMBER_COLOR_KEYS.entries()) {
    paint.setColor(Skia.Color(palette.particle[key]));
    canvas.drawRect(Skia.XYWHRect(index, 0, 1, 1), paint);
  }

  const glow = Skia.Paint();
  const center = { x: GLOW_SPRITE.x + GLOW_TEXTURE_RADIUS, y: GLOW_TEXTURE_RADIUS };

  glow.setShader(Skia.Shader.MakeRadialGradient(center, GLOW_TEXTURE_RADIUS, getBloomGradient(palette.glow), [0, 1], TileMode.Clamp));
  canvas.drawRect(GLOW_SPRITE, glow);

  surface.flush();

  return surface.makeImageSnapshot();
};

export const Embers = memo(({ centerX, centerY, radius, dotSize, effectStartedAt, palette }: EmbersProps) => {
  const image = useMemo(() => drawEmbers(palette), [palette]);
  const glowSprites = useMemo(() => Array.from({ length: EMBER_COUNT }, () => GLOW_SPRITE), []);
  const [embers, setEmbers] = useState<Ember[]>([]);

  const elapsed = useCompletedEffectElapsed(effectStartedAt);

  useEffect(() => {
    // 연출이 끝나면 `CompletedEffect`가 언마운트하므로 정리 예약 없음
    setEmbers(spawnEmbers({ centerX: centerX / dotSize, centerY: centerY / dotSize, radius: radius / dotSize, elapsedMs: Date.now() - effectStartedAt }));
  }, [effectStartedAt, centerX, centerY, radius, dotSize]);

  const states = useDerivedValue(() => embers.map((ember) => emberAt(ember, elapsed.value)));

  const dotSprites = useRectBuffer(EMBER_COUNT, (sprite, index) => {
    'worklet';
    sprite.setXYWH(emberColorIndex(states.value[index]?.life ?? 0), 0, 1, 1);
  });

  const dotTransforms = useRSXformBuffer(EMBER_COUNT, (transform, index) => {
    'worklet';
    const state = states.value[index];

    if (state === undefined || state.life === 0) {
      transform.set(0, 0, 0, 0);
      return;
    }

    transform.set(dotSize, 0, Math.round(state.x) * dotSize, Math.round(state.y) * dotSize);
  });

  const glowRadius = EMBER_GLOW_RADIUS * (dotSize / DOT_SIZE);

  const glowTransforms = useRSXformBuffer(EMBER_COUNT, (transform, index) => {
    'worklet';
    const state = states.value[index];

    if (state === undefined || state.life === 0) {
      transform.set(0, 0, 0, 0);
      return;
    }

    transform.set(glowRadius / GLOW_TEXTURE_RADIUS, 0, state.x * dotSize - glowRadius, state.y * dotSize - glowRadius);
  });

  // 색은 그대로 두고 알파만 낮춤
  const glowColors = useColorBuffer(EMBER_COUNT, (color, index) => {
    'worklet';
    color[0] = 1;
    color[1] = 1;
    color[2] = 1;
    color[3] = EMBER_GLOW_ALPHA * (states.value[index]?.life ?? 0);
  });

  if (image === null || embers.length === 0) return null;

  return (
    <>
      <Atlas image={image} sprites={glowSprites} transforms={glowTransforms} colors={glowColors} colorBlendMode="modulate" sampling={SOFT_SAMPLING} />
      <Atlas image={image} sprites={dotSprites} transforms={dotTransforms} sampling={DOT_SAMPLING} antiAlias={false} />
    </>
  );
});

Embers.displayName = 'Embers';
