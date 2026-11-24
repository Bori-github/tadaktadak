import { Atlas, Skia, TileMode, useColorBuffer, useRSXformBuffer, type SkImage, type SkRect } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { DIAL_ITEM_STYLES } from '../config/items';
import { TICK_NUMBERS } from '../config/ticks';
import { SOFT_SAMPLING } from '../lib/atlas';
import { getBloomGradient } from '../lib/bloom';
import { useChaseBoosts } from '../model/chase';
import { DOT_SIZE } from '@/shared/constants';
import { bulbCenter } from '@/shared/lib';

type PeakGlowProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  settingMinutes: number;
  effectStartedAt: number | null;
};

/** 최대 밝기 전구 흰색 빛 번짐 최대 반지름 (논리 픽셀, 배율 1) */
const PEAK_GLOW_RADIUS = { major: 22, minor: 14 };
const PEAK_GLOW_ALPHA = 0.6;

/** 흰색 빛 번짐 표시 기준 밝기. 이하 미표시 */
const PEAK_GLOW_THRESHOLD = 0.5;

const { glowOffsetInDots = 0 } = DIAL_ITEM_STYLES.winter;

const drawPeakGlow = (): SkImage | null => {
  const radius = PEAK_GLOW_RADIUS.major;
  const surface = Skia.Surface.Make(radius * 2, radius * 2);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();

  canvas.clear(Skia.Color('transparent'));
  paint.setShader(Skia.Shader.MakeRadialGradient({ x: radius, y: radius }, radius, getBloomGradient('#ffffff'), [0, 1], TileMode.Clamp));
  canvas.drawRect(Skia.XYWHRect(0, 0, radius * 2, radius * 2), paint);
  surface.flush();

  return surface.makeImageSnapshot();
};

/** 완료 연출 중 최대 밝기 전구의 흰색 빛 번짐. 전구 스프라이트 아래 레이어 */
export const PeakGlow = memo(({ centerX, centerY, radius, dotSize, settingMinutes, effectStartedAt }: PeakGlowProps) => {
  const image = useMemo(() => drawPeakGlow(), []);

  const glows = useMemo(
    () =>
      TICK_NUMBERS.map((tick) => {
        const center = bulbCenter(tick, { centerX, centerY, radius, dotSize });
        const maxRadius = tick % 5 === 0 ? PEAK_GLOW_RADIUS.major : PEAK_GLOW_RADIUS.minor;

        return { x: center.x, y: center.y + glowOffsetInDots * dotSize, radius: maxRadius * (dotSize / DOT_SIZE) };
      }),
    [centerX, centerY, radius, dotSize],
  );
  const sprites = useMemo<SkRect[]>(() => TICK_NUMBERS.map(() => Skia.XYWHRect(0, 0, PEAK_GLOW_RADIUS.major * 2, PEAK_GLOW_RADIUS.major * 2)), []);

  const boosts = useChaseBoosts(settingMinutes, effectStartedAt);

  const transforms = useRSXformBuffer(TICK_NUMBERS.length, (transform, index) => {
    'worklet';
    const glow = glows[index];
    const boost = boosts.value[index] ?? 0;

    if (!glow || boost <= PEAK_GLOW_THRESHOLD) {
      transform.set(0, 0, 0, 0);
      return;
    }

    const spread = glow.radius * boost;
    transform.set(spread / PEAK_GLOW_RADIUS.major, 0, glow.x - spread, glow.y - spread);
  });

  const colors = useColorBuffer(TICK_NUMBERS.length, (color, index) => {
    'worklet';
    color[0] = 1;
    color[1] = 1;
    color[2] = 1;
    color[3] = PEAK_GLOW_ALPHA * (boosts.value[index] ?? 0);
  });

  if (!image) return null;

  return <Atlas image={image} sprites={sprites} transforms={transforms} colors={colors} colorBlendMode="modulate" sampling={SOFT_SAMPLING} />;
});

PeakGlow.displayName = 'PeakGlow';
