import { Atlas, Skia, TileMode, useColorBuffer, useRSXformBuffer, type SkImage, type SkRect } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo } from 'react';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';

import { DIAL_ITEM_STYLES } from '../config/items';
import { TICK_NUMBERS } from '../config/ticks';
import { DOT_SAMPLING, SOFT_SAMPLING, drawSprites, packSprites } from '../lib/atlas';
import { getBloomGradient } from '../lib/bloom';
import { chaseBoost } from '../lib/chase';
import { DOT_SIZE } from '@/shared/constants';
import { bulbCenter, topLeftOnGrid } from '@/shared/lib';
import { BULB_BIG_ON, BULB_ON, WINTER_SPRITE_COLORS } from '@/shared/ui/dot-sprite';

type BulbChaseProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  settingMinutes: number;
  effectStartedAt: number | null;
};

const GRIDS = [BULB_ON, BULB_BIG_ON];
const PACKED = packSprites(GRIDS);

/** 최대 밝기 전구 흰색 빛 번짐 최대 반지름 (논리 픽셀, 배율 1) */
const PEAK_GLOW_RADIUS = { major: 22, minor: 14 };
const PEAK_GLOW_ALPHA = 0.6;

/** 흰색 빛 번짐 표시 기준 밝기. 이하 미표시 */
const PEAK_GLOW_THRESHOLD = 0.5;

const { completedBrightness, glowOffsetInDots = 0 } = DIAL_ITEM_STYLES.winter;

/** 시작 시각 미설정 값. 첫 프레임에서 기기 가동 시간으로 설정 */
const NOT_STARTED = -1;

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

/** 완료 연출 중 전구 밝기 순환 */
export const BulbChase = memo(({ centerX, centerY, radius, dotSize, settingMinutes, effectStartedAt }: BulbChaseProps) => {
  const image = useMemo(() => drawSprites(GRIDS, PACKED, WINTER_SPRITE_COLORS), []);
  const glowImage = useMemo(() => drawPeakGlow(), []);

  const placements = useMemo(
    () =>
      TICK_NUMBERS.map((tick) => {
        const kind = tick % 5 === 0 ? 1 : 0;
        const box = PACKED.boxes[kind] ?? { left: 0, top: 0, widthInDots: 0, heightInDots: 0 };
        const center = bulbCenter(tick, { centerX, centerY, radius, dotSize });
        const { left, top } = topLeftOnGrid({ centerX: center.x, centerY: center.y, widthInDots: box.widthInDots, heightInDots: box.heightInDots, dotSize });

        return {
          sprite: Skia.XYWHRect(box.left, box.top, box.widthInDots, box.heightInDots),
          x: left * dotSize,
          y: top * dotSize,
          glow: { x: center.x, y: center.y + glowOffsetInDots * dotSize, radius: (kind ? PEAK_GLOW_RADIUS.major : PEAK_GLOW_RADIUS.minor) * (dotSize / DOT_SIZE) },
        };
      }),
    [centerX, centerY, radius, dotSize],
  );
  const sprites = useMemo(() => placements.map((placement) => placement.sprite), [placements]);
  const glowSprites = useMemo<SkRect[]>(() => TICK_NUMBERS.map(() => Skia.XYWHRect(0, 0, PEAK_GLOW_RADIUS.major * 2, PEAK_GLOW_RADIUS.major * 2)), []);

  const elapsed = useSharedValue(0);
  const frameStartedAt = useSharedValue(NOT_STARTED);

  const clock = useFrameCallback((frame) => {
    'worklet';
    if (frameStartedAt.value === NOT_STARTED) frameStartedAt.value = frame.timestamp - elapsed.value;

    elapsed.value = frame.timestamp - frameStartedAt.value;
  }, false);

  useEffect(() => {
    // 백그라운드 경과 시간 반영을 위해 첫 프레임 전 초기화
    frameStartedAt.value = NOT_STARTED;
    elapsed.value = effectStartedAt === null ? 0 : Date.now() - effectStartedAt;
    clock.setActive(effectStartedAt !== null);
    // `useSharedValue` 반환값은 고정 참조라 의존성에서 제외. 포함 시 React Compiler 린트가 내부 사용 차단
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clock, effectStartedAt]);

  const boosts = useDerivedValue(() => TICK_NUMBERS.map((tick) => (tick > settingMinutes ? 0 : chaseBoost({ tick, elapsedMs: elapsed.value, settingMinutes }))));

  const transforms = useRSXformBuffer(TICK_NUMBERS.length, (transform, index) => {
    'worklet';
    const placement = placements[index];
    if (placement) transform.set(dotSize, 0, placement.x, placement.y);
  });

  // RGB 유지, 알파만 변조. 완료 밝기와 합산 시 최대 1
  const colors = useColorBuffer(TICK_NUMBERS.length, (color, index) => {
    'worklet';
    color[0] = 1;
    color[1] = 1;
    color[2] = 1;
    color[3] = (1 - completedBrightness) * (boosts.value[index] ?? 0);
  });

  const glowTransforms = useRSXformBuffer(TICK_NUMBERS.length, (transform, index) => {
    'worklet';
    const glow = placements[index]?.glow;
    const boost = boosts.value[index] ?? 0;

    if (!glow || boost <= PEAK_GLOW_THRESHOLD) {
      transform.set(0, 0, 0, 0);
      return;
    }

    const spread = glow.radius * boost;
    transform.set(spread / PEAK_GLOW_RADIUS.major, 0, glow.x - spread, glow.y - spread);
  });

  const glowColors = useColorBuffer(TICK_NUMBERS.length, (color, index) => {
    'worklet';
    color[0] = 1;
    color[1] = 1;
    color[2] = 1;
    color[3] = PEAK_GLOW_ALPHA * (boosts.value[index] ?? 0);
  });

  if (effectStartedAt === null || !image || !glowImage) return null;

  return (
    <>
      <Atlas image={glowImage} sprites={glowSprites} transforms={glowTransforms} colors={glowColors} colorBlendMode="modulate" sampling={SOFT_SAMPLING} />
      <Atlas image={image} sprites={sprites} transforms={transforms} colors={colors} colorBlendMode="modulate" sampling={DOT_SAMPLING} antiAlias={false} />
    </>
  );
});

BulbChase.displayName = 'BulbChase';
