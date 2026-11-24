import { Atlas, Skia, useColorBuffer, useRSXformBuffer } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';

import { DIAL_ITEM_STYLES } from '../config/items';
import { TICK_NUMBERS } from '../config/ticks';
import { DOT_SAMPLING, drawSprites, packSprites } from '../lib/atlas';
import { useChaseBoosts } from '../model/chase';
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

const { completedBrightness } = DIAL_ITEM_STYLES.winter;

/** 완료 연출 중 전구 밝기 순환 */
export const BulbChase = memo(({ centerX, centerY, radius, dotSize, settingMinutes, effectStartedAt }: BulbChaseProps) => {
  const image = useMemo(() => drawSprites(GRIDS, PACKED, WINTER_SPRITE_COLORS), []);

  const placements = useMemo(
    () =>
      TICK_NUMBERS.map((tick) => {
        const box = PACKED.boxes[tick % 5 === 0 ? 1 : 0] ?? { left: 0, top: 0, widthInDots: 0, heightInDots: 0 };
        const center = bulbCenter(tick, { centerX, centerY, radius, dotSize });
        const { left, top } = topLeftOnGrid({ centerX: center.x, centerY: center.y, widthInDots: box.widthInDots, heightInDots: box.heightInDots, dotSize });

        return { sprite: Skia.XYWHRect(box.left, box.top, box.widthInDots, box.heightInDots), x: left * dotSize, y: top * dotSize };
      }),
    [centerX, centerY, radius, dotSize],
  );
  const sprites = useMemo(() => placements.map((placement) => placement.sprite), [placements]);

  const boosts = useChaseBoosts(settingMinutes, effectStartedAt);

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

  if (!image) return null;

  return <Atlas image={image} sprites={sprites} transforms={transforms} colors={colors} colorBlendMode="modulate" sampling={DOT_SAMPLING} antiAlias={false} />;
});

BulbChase.displayName = 'BulbChase';
