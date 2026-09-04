import { Atlas, Circle, Group, RadialGradient, Skia, TileMode, vec, type SkImage, type SkRect, type SkRSXform } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { DOT_SAMPLING, SOFT_SAMPLING, packSprites, type PackedSprites } from '../lib/atlas';
import { TICK_NUMBERS } from '../config/ticks';
import { BLOOM_ALPHA, BLOOM_GRADIENT, BLOOM_RADIUS, CENTER_BLOOM_ALPHA, CENTER_BLOOM_RATIO, bloomRadius } from '../lib/bloom';
import { pointOnDial } from '../lib/geometry';
import { useFlickerStep } from '../model/flicker';
import { ignitionProgress } from '@/entities/timer';
import { topLeftOnGrid } from '@/shared/lib';
import {
  BONFIRE_COLD_7,
  BONFIRE_COLD_9,
  BONFIRE_HOT_A_7,
  BONFIRE_HOT_A_9,
  BONFIRE_HOT_B_7,
  BONFIRE_HOT_B_9,
  LOG_COLD,
  LOG_HOT_A,
  LOG_HOT_B,
  MARKER,
  SPRITE_COLORS,
} from '@/shared/ui/dot-sprite';

/** 이미지에 담은 순서 */
const LOG = 0;
const BONFIRE = 1;
const START_MARKER = 2;
const LOG_A = 3;
const LOG_B = 4;
const BONFIRE_A = 5;
const BONFIRE_B = 6;

type DialItemsProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  isCompact: boolean;
  /** 남은 시간(분). 대기에서는 설정 시간이라 아무 눈금도 붙지 않음 */
  remainingMinutes: number;
  settingMinutes: number;
  /** 일시정지 여부. 일시정지에서 불꽃이 멈춤. `DESIGN.md` §8 */
  isPaused: boolean;
  /** 대기 상태 여부. 대기 상태에서 가운데 빛 번짐이 없음. `DESIGN.md` §6 */
  isReady: boolean;
};

type Placement = { sprite: SkRect; transform: SkRSXform };

/** `Atlas`의 `sprites`·`transforms`에 그대로 넘길 두 배열 */
type AtlasBatch = { sprites: SkRect[]; transforms: SkRSXform[] };

const BLOOM_SPRITES = {
  bonfire: Skia.XYWHRect(0, 0, BLOOM_RADIUS.bonfire * 2, BLOOM_RADIUS.bonfire * 2),
  log: Skia.XYWHRect(BLOOM_RADIUS.bonfire * 2, 0, BLOOM_RADIUS.log * 2, BLOOM_RADIUS.log * 2),
};

/** 일시정지에서 잦아드는 불 밝기와 걸리는 시간. `DESIGN.md` §8 §9 */
const PAUSED_BRIGHTNESS = 0.35;
const FADE_MS = 500;

/** 설정 시간 밖 눈금 알파 */
const OUT_OF_SETTING_ALPHA = 0.55;

/** 가운데 빛 번짐이 나타나는 시간. `DESIGN.md` §9 */
const CENTER_BLOOM_FADE_IN_MS = 300;

const toBatch = (items: Placement[]): AtlasBatch => ({
  sprites: items.map((item) => item.sprite),
  transforms: items.map((item) => item.transform),
});

/** 도트 하나를 픽셀 하나로 그린 작은 이미지. 그릴 때 dotSize배로 키워 씀 */
const drawAtlas = (grids: readonly (readonly string[])[], packed: PackedSprites): SkImage | null => {
  const surface = Skia.Surface.Make(packed.image.widthInDots, packed.image.heightInDots);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();

  // 새로 만든 표면이 비워진 채로 오지 않아, 격자에서 비워 둔 자리에 이전 내용이 비침
  canvas.clear(Skia.Color('transparent'));

  for (const [index, grid] of grids.entries()) {
    const box = packed.boxes[index];
    if (!box) continue;

    for (const [row, line] of grid.entries()) {
      for (let column = 0; column < box.widthInDots; column++) {
        const color = SPRITE_COLORS[line[column] ?? ''];
        if (!color) continue;

        paint.setColor(Skia.Color(color));
        canvas.drawRect(Skia.XYWHRect(box.left + column, box.top + row, 1, 1), paint);
      }
    }
  }

  surface.flush();

  return surface.makeImageSnapshot();
};

/** 반지름별 텍스처 두 장을 만든다. 매 프레임 부르지 않고, 그릴 때 알파와 스케일만 변경 `DESIGN.md` §6 */
const drawBloom = (): SkImage | null => {
  const { bonfire, log } = BLOOM_RADIUS;
  const surface = Skia.Surface.Make((bonfire + log) * 2, bonfire * 2);
  if (!surface) return null;

  const canvas = surface.getCanvas();

  canvas.clear(Skia.Color('transparent'));

  for (const [rect, radius] of [
    [BLOOM_SPRITES.bonfire, bonfire],
    [BLOOM_SPRITES.log, log],
  ] as const) {
    const paint = Skia.Paint();
    const center = { x: rect.x + radius, y: rect.y + radius };

    paint.setShader(Skia.Shader.MakeRadialGradient(center, radius, BLOOM_GRADIENT, [0, 1], TileMode.Clamp));
    canvas.drawRect(rect, paint);
  }

  surface.flush();

  return surface.makeImageSnapshot();
};

export const DialItems = memo(({ centerX, centerY, radius, dotSize, isCompact, remainingMinutes, settingMinutes, isPaused, isReady }: DialItemsProps) => {
  const grids = useMemo(
    () => [
      LOG_COLD,
      isCompact ? BONFIRE_COLD_7 : BONFIRE_COLD_9,
      MARKER,
      LOG_HOT_A,
      LOG_HOT_B,
      isCompact ? BONFIRE_HOT_A_7 : BONFIRE_HOT_A_9,
      isCompact ? BONFIRE_HOT_B_7 : BONFIRE_HOT_B_9,
    ],
    [isCompact],
  );

  const packed = useMemo(() => packSprites(grids), [grids]);
  const image = useMemo(() => drawAtlas(grids, packed), [grids, packed]);
  const bloomImage = useMemo(() => drawBloom(), []);

  // 스프라이트 사각형과 좌표는 시계판 크기로만 정해지므로 미리 만들어 두고 고르기만 함
  const prepared = useMemo(() => {
    const spriteOf = (kind: number): SkRect => {
      const box = packed.boxes[kind];
      return box ? Skia.XYWHRect(box.left, box.top, box.widthInDots, box.heightInDots) : Skia.XYWHRect(0, 0, 0, 0);
    };

    const transformOf = (kind: number, x: number, y: number): SkRSXform => {
      const box = packed.boxes[kind];
      if (!box) return Skia.RSXform(dotSize, 0, 0, 0);

      const { left, top } = topLeftOnGrid({ centerX: x, centerY: y, widthInDots: box.widthInDots, heightInDots: box.heightInDots, dotSize });
      return Skia.RSXform(dotSize, 0, left * dotSize, top * dotSize);
    };

    const base: Placement[] = [];
    const perTick = TICK_NUMBERS.map((tick) => {
      const isMajorTick = tick % 5 === 0;
      const point = pointOnDial(centerX, centerY, radius, (tick - 0.5) * 6);
      const transform = transformOf(isMajorTick ? BONFIRE : LOG, point.x, point.y);

      base.push({ sprite: spriteOf(isMajorTick ? BONFIRE : LOG), transform });

      // 홀짝으로 A와 B를 구분함
      return { tick, point, transform, hot: [spriteOf(isMajorTick ? BONFIRE_A : LOG_A), spriteOf(isMajorTick ? BONFIRE_B : LOG_B)] };
    });

    // 불붙은 모닥불과 한 도트 겹치므로 나중에 그려 덮음. `DESIGN.md` §5 겹침 검산
    const marker = toBatch([{ sprite: spriteOf(START_MARKER), transform: transformOf(START_MARKER, centerX, centerY - radius) }]);

    return { base: toBatch(base), marker, perTick };
  }, [packed, dotSize, centerX, centerY, radius]);

  const { baseInSetting, baseOutOfSetting } = useMemo(
    () => ({
      baseInSetting: { sprites: prepared.base.sprites.slice(0, settingMinutes), transforms: prepared.base.transforms.slice(0, settingMinutes) },
      baseOutOfSetting: { sprites: prepared.base.sprites.slice(settingMinutes), transforms: prepared.base.transforms.slice(settingMinutes) },
    }),
    [prepared, settingMinutes],
  );

  const lit = useMemo(() => TICK_NUMBERS.map((tick) => ignitionProgress({ tick, remainingMinutes, settingMinutes })), [remainingMinutes, settingMinutes]);

  const step = useFlickerStep(!isPaused && lit.some((progress) => progress > 0));

  const brightness = useSharedValue(1);

  useEffect(() => {
    brightness.value = withTiming(isPaused ? PAUSED_BRIGHTNESS : 1, { duration: FADE_MS, easing: Easing.inOut(Easing.quad) });
    // `useSharedValue`가 준 값은 고정 참조라 뺌. 넣으면 React Compiler 린트가 안에서 쓰는 것을 막음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

  const centerBloom = useSharedValue(0);

  useEffect(() => {
    centerBloom.value = isReady ? 0 : withTiming(CENTER_BLOOM_ALPHA, { duration: CENTER_BLOOM_FADE_IN_MS, easing: Easing.inOut(Easing.quad) });
    // `useSharedValue`가 준 값은 고정 참조라 뺌. 넣으면 React Compiler 린트가 안에서 쓰는 것을 막음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady]);

  const hot = useMemo(() => {
    const burning: Placement[] = [];
    const filling: (Placement & { progress: number; tick: number })[] = [];

    for (const [index, item] of prepared.perTick.entries()) {
      const progress = lit[index] ?? 0;
      if (progress === 0) continue;

      const sprite = item.hot[(item.tick + step) % 2] ?? item.hot[0];
      if (!sprite) continue;

      if (progress === 1) burning.push({ sprite, transform: item.transform });
      else filling.push({ sprite, transform: item.transform, progress, tick: item.tick });
    }

    return { burning: toBatch(burning), filling };
  }, [prepared, lit, step]);

  const bloom = useMemo(() => {
    const bonfires: Placement[] = [];
    const logs: Placement[] = [];
    const filling: (Placement & { alpha: number; tick: number })[] = [];

    for (const [index, item] of prepared.perTick.entries()) {
      const progress = lit[index] ?? 0;
      if (progress === 0) continue;

      const isMajorTick = item.tick % 5 === 0;
      const spread = bloomRadius({ tick: item.tick, isMajorTick, progress, step, dotSize });
      const sprite = isMajorTick ? BLOOM_SPRITES.bonfire : BLOOM_SPRITES.log;
      const source = isMajorTick ? BLOOM_RADIUS.bonfire : BLOOM_RADIUS.log;
      const placement = { sprite, transform: Skia.RSXform(spread / source, 0, item.point.x - spread, item.point.y - spread) };
      const alpha = isMajorTick ? BLOOM_ALPHA.bonfire : BLOOM_ALPHA.log;

      if (progress < 1) filling.push({ ...placement, alpha: alpha * progress, tick: item.tick });
      else if (isMajorTick) bonfires.push(placement);
      else logs.push(placement);
    }

    return { bonfires: toBatch(bonfires), logs: toBatch(logs), filling };
  }, [prepared, lit, step, dotSize]);

  if (!image) return null;

  return (
    <>
      {bloomImage === null ? null : (
        <Group opacity={brightness}>
          {isReady ? null : (
            <Group opacity={centerBloom}>
              <Circle cx={centerX} cy={centerY} r={radius * CENTER_BLOOM_RATIO}>
                <RadialGradient c={vec(centerX, centerY)} r={radius * CENTER_BLOOM_RATIO} colors={BLOOM_GRADIENT} />
              </Circle>
            </Group>
          )}
          {bloom.bonfires.sprites.length === 0 ? null : (
            <Group opacity={BLOOM_ALPHA.bonfire}>
              <Atlas image={bloomImage} sprites={bloom.bonfires.sprites} transforms={bloom.bonfires.transforms} sampling={SOFT_SAMPLING} />
            </Group>
          )}
          {bloom.logs.sprites.length === 0 ? null : (
            <Group opacity={BLOOM_ALPHA.log}>
              <Atlas image={bloomImage} sprites={bloom.logs.sprites} transforms={bloom.logs.transforms} sampling={SOFT_SAMPLING} />
            </Group>
          )}
          {bloom.filling.map((item) => (
            <Group key={item.tick} opacity={item.alpha}>
              <Atlas image={bloomImage} sprites={[item.sprite]} transforms={[item.transform]} sampling={SOFT_SAMPLING} />
            </Group>
          ))}
        </Group>
      )}
      {baseInSetting.sprites.length === 0 ? null : (
        <Atlas image={image} sprites={baseInSetting.sprites} transforms={baseInSetting.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
      )}
      {baseOutOfSetting.sprites.length === 0 ? null : (
        <Group opacity={OUT_OF_SETTING_ALPHA}>
          <Atlas image={image} sprites={baseOutOfSetting.sprites} transforms={baseOutOfSetting.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
        </Group>
      )}
      <Group opacity={brightness}>
        {hot.burning.sprites.length === 0 ? null : (
          <Atlas image={image} sprites={hot.burning.sprites} transforms={hot.burning.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
        )}
        {hot.filling.map((item) => (
          <Group key={item.tick} opacity={item.progress}>
            <Atlas image={image} sprites={[item.sprite]} transforms={[item.transform]} sampling={DOT_SAMPLING} antiAlias={false} />
          </Group>
        ))}
      </Group>
      <Atlas image={image} sprites={prepared.marker.sprites} transforms={prepared.marker.transforms} sampling={DOT_SAMPLING} antiAlias={false} />
    </>
  );
});

DialItems.displayName = 'DialItems';
