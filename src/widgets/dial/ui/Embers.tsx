import { Atlas, Skia, TileMode, useColorBuffer, useRSXformBuffer, useRectBuffer, type SkImage } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo, useState } from 'react';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { DOT_SAMPLING, SOFT_SAMPLING } from '../lib/atlas';
import { BLOOM_GRADIENT } from '../lib/bloom';
import { EMBER_COLORS, EMBER_COUNT, EMBER_GLOW_ALPHA, EMBER_GLOW_RADIUS, emberAt, emberColorIndex, spawnEmbers, type Ember } from '../lib/ember';
import { COMPLETED_EFFECT_MS } from '@/entities/timer';
import { DOT_SIZE } from '@/shared/constants';

type EmbersProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  isShown: boolean;
};

/** 잔광 텍스처 반지름 (px) */
const GLOW_TEXTURE_RADIUS = 8;

const GLOW_SPRITE = Skia.XYWHRect(EMBER_COLORS.length, 0, GLOW_TEXTURE_RADIUS * 2, GLOW_TEXTURE_RADIUS * 2);

/** 시작 시각이 비었다는 표식. 첫 프레임에서 기기 가동 시간으로 채우고, 완료마다 되돌림 */
const NOT_STARTED = -1;

/** 불티 색마다 도트 하나와 잔광 한 장을 담은 아틀라스 */
const drawEmbers = (): SkImage | null => {
  const surface = Skia.Surface.Make(EMBER_COLORS.length + GLOW_TEXTURE_RADIUS * 2, GLOW_TEXTURE_RADIUS * 2);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();

  canvas.clear(Skia.Color('transparent'));

  for (const [index, color] of EMBER_COLORS.entries()) {
    paint.setColor(Skia.Color(color));
    canvas.drawRect(Skia.XYWHRect(index, 0, 1, 1), paint);
  }

  const glow = Skia.Paint();
  const center = { x: GLOW_SPRITE.x + GLOW_TEXTURE_RADIUS, y: GLOW_TEXTURE_RADIUS };

  glow.setShader(Skia.Shader.MakeRadialGradient(center, GLOW_TEXTURE_RADIUS, BLOOM_GRADIENT, [0, 1], TileMode.Clamp));
  canvas.drawRect(GLOW_SPRITE, glow);

  surface.flush();

  return surface.makeImageSnapshot();
};

export const Embers = memo(({ centerX, centerY, radius, dotSize, isShown }: EmbersProps) => {
  const image = useMemo(() => drawEmbers(), []);
  const glowSprites = useMemo(() => Array.from({ length: EMBER_COUNT }, () => GLOW_SPRITE), []);
  const [embers, setEmbers] = useState<Ember[]>([]);

  const elapsed = useSharedValue(0);
  const startedAt = useSharedValue(NOT_STARTED);

  const rising = useFrameCallback((frame) => {
    'worklet';
    if (startedAt.value === NOT_STARTED) startedAt.value = frame.timestamp;

    elapsed.value = frame.timestamp - startedAt.value;
  }, false);

  useEffect(() => {
    if (!isShown) {
      setEmbers([]);
      return;
    }

    startedAt.value = NOT_STARTED;
    elapsed.value = 0;
    setEmbers(spawnEmbers({ centerX: centerX / dotSize, centerY: centerY / dotSize, radius: radius / dotSize }));

    const burnedOut = setTimeout(() => setEmbers([]), COMPLETED_EFFECT_MS);

    return () => clearTimeout(burnedOut);
    // `useSharedValue`가 준 값은 고정 참조라 뺌. 넣으면 React Compiler 린트가 안에서 쓰는 것을 막음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShown, centerX, centerY, radius, dotSize]);

  useEffect(() => {
    rising.setActive(embers.length > 0);
  }, [rising, embers]);

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
