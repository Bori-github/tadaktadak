import { Atlas, FilterMode, MipmapMode, Skia, type SkImage } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { packSprites } from '../lib/atlas';
import { pointOnDial } from '../lib/geometry';
import { topLeftOnGrid } from '@/shared/lib';
import { BONFIRE_COLD_7, BONFIRE_COLD_9, LOG_COLD, MARKER, SPRITE_COLORS } from '@/shared/ui/dot-sprite';

const SLOTS = 60;

const SLOT_NUMBERS = Array.from({ length: SLOTS }, (_, index) => index + 1);

/** 이미지에 담은 순서. 자를 자리와 놓을 자리가 이 번호로 짝을 찾음 */
const LOG = 0;
const BONFIRE = 1;
const START_MARKER = 2;

type DialItemsProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  bonfireDots: number;
};

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

export const DialItems = memo(({ centerX, centerY, radius, dotSize, bonfireDots }: DialItemsProps) => {
  const grids = useMemo(() => [LOG_COLD, bonfireDots === 9 ? BONFIRE_COLD_9 : BONFIRE_COLD_7, MARKER], [bonfireDots]);

  const image = useMemo(() => drawAtlas(grids), [grids]);

  const placed = useMemo(() => {
    const slots = SLOT_NUMBERS.map((slot) => {
      const point = pointOnDial(centerX, centerY, radius, (slot - 0.5) * 6);
      return { kind: slot % 5 === 0 ? BONFIRE : LOG, x: point.x, y: point.y };
    });

    return [...slots, { kind: START_MARKER, x: centerX, y: centerY - radius }];
  }, [centerX, centerY, radius]);

  const sprites = useMemo(() => {
    const { boxes } = packSprites(grids);

    return placed.map(({ kind }) => {
      const box = boxes[kind];
      return box ? Skia.XYWHRect(box.left, box.top, box.widthInDots, box.heightInDots) : Skia.XYWHRect(0, 0, 0, 0);
    });
  }, [grids, placed]);

  const transforms = useMemo(() => {
    const { boxes } = packSprites(grids);

    return placed.map(({ kind, x, y }) => {
      const box = boxes[kind];
      if (!box) return Skia.RSXform(dotSize, 0, 0, 0);

      const { left, top } = topLeftOnGrid({ centerX: x, centerY: y, widthInDots: box.widthInDots, heightInDots: box.heightInDots, dotSize });
      return Skia.RSXform(dotSize, 0, left * dotSize, top * dotSize);
    });
  }, [grids, placed, dotSize]);

  if (!image) return null;

  return <Atlas image={image} sprites={sprites} transforms={transforms} sampling={{ filter: FilterMode.Nearest, mipmap: MipmapMode.None }} />;
});

DialItems.displayName = 'DialItems';
