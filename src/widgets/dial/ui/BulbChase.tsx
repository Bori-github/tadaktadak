import { Atlas, Skia, useColorBuffer } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { DIAL_ITEM_STYLES } from '../config/items';
import { TICK_NUMBERS } from '../config/ticks';
import { useChaseBoosts } from '../model/chase';
import { type MajorItemHeightInDots } from '@/shared/constants';
import { DOT_SAMPLING, bulbCenter, drawSprites, packSprites, topLeftOnGrid } from '@/shared/lib';

type BulbChaseProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  majorItemHeightInDots: MajorItemHeightInDots;
  settingMinutes: number;
  effectStartedAt: number;
};

const { minor, major, colors: spriteColors, completedBrightness } = DIAL_ITEM_STYLES.winter;

/** 완료 연출 중 전구 밝기 순환 */
export const BulbChase = memo(({ centerX, centerY, radius, dotSize, majorItemHeightInDots, settingMinutes, effectStartedAt }: BulbChaseProps) => {
  // 점화 후 첫 프레임. 1분 전구, 5분 전구 순
  const grids = useMemo(() => [minor.frames[0] ?? minor.base, major[majorItemHeightInDots].frames[0] ?? major[majorItemHeightInDots].base], [majorItemHeightInDots]);
  const packed = useMemo(() => packSprites(grids), [grids]);
  const image = useMemo(() => drawSprites(grids, packed, spriteColors), [grids, packed]);

  const { sprites, transforms } = useMemo(() => {
    const placements = TICK_NUMBERS.map((tick) => {
      const box = packed.boxes[tick % 5 === 0 ? 1 : 0] ?? { left: 0, top: 0, widthInDots: 0, heightInDots: 0 };
      const center = bulbCenter(tick, { centerX, centerY, radius, dotSize });
      const { left, top } = topLeftOnGrid({ centerX: center.x, centerY: center.y, widthInDots: box.widthInDots, heightInDots: box.heightInDots, dotSize });

      return { sprite: Skia.XYWHRect(box.left, box.top, box.widthInDots, box.heightInDots), transform: Skia.RSXform(dotSize, 0, left * dotSize, top * dotSize) };
    });

    return { sprites: placements.map((placement) => placement.sprite), transforms: placements.map((placement) => placement.transform) };
  }, [packed, centerX, centerY, radius, dotSize]);

  const boosts = useChaseBoosts(settingMinutes, effectStartedAt);

  // RGB 유지, 알파만 변조. 완료 밝기와 합산 시 최대 1
  const colors = useColorBuffer(TICK_NUMBERS.length, (color, index) => {
    'worklet';
    color[0] = 1;
    color[1] = 1;
    color[2] = 1;
    color[3] = (1 - completedBrightness) * (boosts.value[index] ?? 0);
  });

  if (!image) return null;

  return <Atlas image={image} sprites={sprites} transforms={transforms} colors={colors} colorBlendMode="modulate" sampling={DOT_SAMPLING} antiAlias={false} />;
});

BulbChase.displayName = 'BulbChase';
