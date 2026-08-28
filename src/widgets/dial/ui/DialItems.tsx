import { Atlas, FilterMode, Group, MipmapMode, Skia, type SkImage, type SkRect, type SkRSXform } from '@shopify/react-native-skia';
import { memo, useMemo, type JSX } from 'react';

import { packSprites } from '../lib/atlas';
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

const SLOTS = 60;

const SLOT_NUMBERS = Array.from({ length: SLOTS }, (_, index) => index + 1);

/** 이미지에 담은 순서. 자를 자리와 놓을 자리가 이 번호로 짝을 찾음 */
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
  /** 남은 시간(분). 대기에서는 설정 시간이라 아무 칸도 붙지 않음 */
  remainingMinutes: number;
  settingMinutes: number;
  /** 일시정지 여부. 일시정지에서 불꽃이 멈춤. `DESIGN.md` §8 */
  isPaused: boolean;
};

type Placement = { sprite: SkRect; transform: SkRSXform };

/** 도트 하나를 픽셀 하나로 그린 작은 이미지. 그릴 때 dotSize배로 키워 씀 */
const drawAtlas = (grids: readonly (readonly string[])[]): SkImage | null => {
  const packed = packSprites(grids);
  const surface = Skia.Surface.MakeOffscreen(packed.image.widthInDots, packed.image.heightInDots);
  if (!surface) return null;

  const canvas = surface.getCanvas();
  const paint = Skia.Paint();

  // 새로 만든 표면이 비워진 채로 오지 않아, 격자에서 비워 둔 칸에 이전 내용이 비침
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

  // 그래픽 메모리에 그대로 두면 화면을 그릴 때 읽지 못해, 일반 메모리로 옮김
  return surface.makeImageSnapshot().makeNonTextureImage();
};

export const DialItems = memo(({ centerX, centerY, radius, dotSize, bonfireDots, remainingMinutes, settingMinutes, isPaused }: DialItemsProps) => {
  const tall = bonfireDots === 9;

  const grids = useMemo(
    () => [LOG_COLD, tall ? BONFIRE_COLD_9 : BONFIRE_COLD_7, MARKER, LOG_HOT_A, LOG_HOT_B, tall ? BONFIRE_HOT_A_9 : BONFIRE_HOT_A_7, tall ? BONFIRE_HOT_B_9 : BONFIRE_HOT_B_7],
    [tall],
  );

  const image = useMemo(() => drawAtlas(grids), [grids]);
  const packed = useMemo(() => packSprites(grids), [grids]);

  const placementOf = useMemo(() => {
    return (kind: number, x: number, y: number): Placement => {
      const box = packed.boxes[kind];
      if (!box) return { sprite: Skia.XYWHRect(0, 0, 0, 0), transform: Skia.RSXform(dotSize, 0, 0, 0) };

      const { left, top } = topLeftOnGrid({ centerX: x, centerY: y, widthInDots: box.widthInDots, heightInDots: box.heightInDots, dotSize });

      return {
        sprite: Skia.XYWHRect(box.left, box.top, box.widthInDots, box.heightInDots),
        transform: Skia.RSXform(dotSize, 0, left * dotSize, top * dotSize),
      };
    };
  }, [packed, dotSize]);

  const slots = useMemo(
    () =>
      SLOT_NUMBERS.map((slot) => {
        const point = pointOnDial(centerX, centerY, radius, (slot - 0.5) * 6);
        return { slot, isBonfire: slot % 5 === 0, x: point.x, y: point.y };
      }),
    [centerX, centerY, radius],
  );

  const lit = useMemo(() => slots.map(({ slot }) => ignitionProgress({ slot, remainingMinutes, settingMinutes })), [slots, remainingMinutes, settingMinutes]);

  const step = useFlickerStep(!isPaused && lit.some((progress) => progress > 0));

  const cold = useMemo(() => {
    const items = slots.map(({ isBonfire, x, y }) => placementOf(isBonfire ? BONFIRE : LOG, x, y));
    return [...items, placementOf(START_MARKER, centerX, centerY - radius)];
  }, [slots, placementOf, centerX, centerY, radius]);

  const hot = useMemo(() => {
    const burning: Placement[] = [];
    const filling: (Placement & { progress: number; slot: number })[] = [];

    for (const [index, { slot, isBonfire, x, y }] of slots.entries()) {
      const progress = lit[index] ?? 0;
      if (progress === 0) continue;

      // 칸 번호를 더해 이웃 칸과 A·B가 엇갈리게 함
      const second = (slot + step) % 2 === 1;
      const placement = placementOf(isBonfire ? (second ? BONFIRE_B : BONFIRE_A) : second ? LOG_B : LOG_A, x, y);

      if (progress === 1) burning.push(placement);
      else filling.push({ ...placement, progress, slot });
    }

    return { burning, filling };
  }, [slots, lit, step, placementOf]);

  if (!image) return null;

  const sampling = { filter: FilterMode.Nearest, mipmap: MipmapMode.None };
  const drawAll = (items: Placement[]): JSX.Element | null =>
    items.length === 0 ? null : <Atlas image={image} sprites={items.map((item) => item.sprite)} transforms={items.map((item) => item.transform)} sampling={sampling} />;

  return (
    <>
      {drawAll(cold)}
      {drawAll(hot.burning)}
      {hot.filling.map((item) => (
        <Group key={item.slot} opacity={item.progress}>
          <Atlas image={image} sprites={[item.sprite]} transforms={[item.transform]} sampling={sampling} />
        </Group>
      ))}
    </>
  );
});

DialItems.displayName = 'DialItems';
