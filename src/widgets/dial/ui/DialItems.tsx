import { Atlas, FilterMode, Group, MipmapMode, Skia, type SkImage, type SkRect, type SkRSXform } from '@shopify/react-native-skia';
import { memo, useEffect, useMemo } from 'react';
import { Easing, useSharedValue, withTiming } from 'react-native-reanimated';

import { packSprites, type PackedSprites } from '../lib/atlas';
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

const TICKS = 60;

const TICK_NUMBERS = Array.from({ length: TICKS }, (_, index) => index + 1);

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
  bonfireDots: number;
  /** 남은 시간(분). 대기에서는 설정 시간이라 아무 눈금도 붙지 않음 */
  remainingMinutes: number;
  settingMinutes: number;
  /** 일시정지 여부. 일시정지에서 불꽃이 멈춤. `DESIGN.md` §8 */
  isPaused: boolean;
};

type Placement = { sprite: SkRect; transform: SkRSXform };

/** `Atlas`의 `sprites`·`transforms`에 그대로 넘길 두 배열 */
type AtlasBatch = { sprites: SkRect[]; transforms: SkRSXform[] };

const SAMPLING = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };

/** 일시정지에서 잦아드는 불 밝기와 걸리는 시간. `DESIGN.md` §8 §9 */
const PAUSED_BRIGHTNESS = 0.35;
const FADE_MS = 500;

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

export const DialItems = memo(({ centerX, centerY, radius, dotSize, bonfireDots, remainingMinutes, settingMinutes, isPaused }: DialItemsProps) => {
  const tall = bonfireDots === 9;

  const grids = useMemo(
    () => [LOG_COLD, tall ? BONFIRE_COLD_9 : BONFIRE_COLD_7, MARKER, LOG_HOT_A, LOG_HOT_B, tall ? BONFIRE_HOT_A_9 : BONFIRE_HOT_A_7, tall ? BONFIRE_HOT_B_9 : BONFIRE_HOT_B_7],
    [tall],
  );

  const packed = useMemo(() => packSprites(grids), [grids]);
  const image = useMemo(() => drawAtlas(grids, packed), [grids, packed]);

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

    const cold: Placement[] = [];
    const perTick = TICK_NUMBERS.map((tick) => {
      const isBonfire = tick % 5 === 0;
      const point = pointOnDial(centerX, centerY, radius, (tick - 0.5) * 6);
      const transform = transformOf(isBonfire ? BONFIRE : LOG, point.x, point.y);

      cold.push({ sprite: spriteOf(isBonfire ? BONFIRE : LOG), transform });

      // 홀짝으로 A와 B를 구분함
      return { tick, transform, hot: [spriteOf(isBonfire ? BONFIRE_A : LOG_A), spriteOf(isBonfire ? BONFIRE_B : LOG_B)] };
    });

    // 불붙은 모닥불과 한 도트 겹치므로 나중에 그려 덮음. `DESIGN.md` §5 겹침 검산
    const marker = toBatch([{ sprite: spriteOf(START_MARKER), transform: transformOf(START_MARKER, centerX, centerY - radius) }]);

    return { cold: toBatch(cold), marker, perTick };
  }, [packed, dotSize, centerX, centerY, radius]);

  const lit = useMemo(() => TICK_NUMBERS.map((tick) => ignitionProgress({ tick, remainingMinutes, settingMinutes })), [remainingMinutes, settingMinutes]);

  const step = useFlickerStep(!isPaused && lit.some((progress) => progress > 0));

  const brightness = useSharedValue(1);

  useEffect(() => {
    brightness.value = withTiming(isPaused ? PAUSED_BRIGHTNESS : 1, { duration: FADE_MS, easing: Easing.inOut(Easing.quad) });
    // `useSharedValue`가 준 값은 고정 참조라 뺌. 넣으면 React Compiler 린트가 안에서 쓰는 것을 막음
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused]);

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

  if (!image) return null;

  return (
    <>
      <Atlas image={image} sprites={prepared.cold.sprites} transforms={prepared.cold.transforms} sampling={SAMPLING} antiAlias={false} />
      <Group opacity={brightness}>
        {hot.burning.sprites.length === 0 ? null : <Atlas image={image} sprites={hot.burning.sprites} transforms={hot.burning.transforms} sampling={SAMPLING} antiAlias={false} />}
        {hot.filling.map((item) => (
          <Group key={item.tick} opacity={item.progress}>
            <Atlas image={image} sprites={[item.sprite]} transforms={[item.transform]} sampling={SAMPLING} antiAlias={false} />
          </Group>
        ))}
      </Group>
      <Atlas image={image} sprites={prepared.marker.sprites} transforms={prepared.marker.transforms} sampling={SAMPLING} antiAlias={false} />
    </>
  );
});

DialItems.displayName = 'DialItems';
