import { Group } from '@shopify/react-native-skia';
import { memo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { pointOnDial } from '../lib/geometry';
import { thumbGrid } from '../lib/twinkle';
import { useFlickerStep } from '../model/flicker';
import { type TimerMode } from '@/entities/timer';
import { topLeftOnGrid } from '@/shared/lib';
import { DotSprite } from '@/shared/ui/dot-sprite';

type ThumbProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  /** 손잡이가 가리키는 분 */
  minutes: SharedValue<number>;
  mode: TimerMode;
  /** 반짝임 여부. `DESIGN.md` §8 손잡이 색과 움직임 */
  isTwinkling: boolean;
};

export const Thumb = memo(({ centerX, centerY, radius, dotSize, minutes, mode, isTwinkling }: ThumbProps) => {
  const step = useFlickerStep(isTwinkling);
  const grid = thumbGrid({ mode, isTwinkling, step });
  const widthInDots = grid[0]?.length ?? 0;
  const heightInDots = grid.length;

  // 격자에 맞춘 좌표끼리 빼야 도트 정렬 유지. `DESIGN.md` §5
  const { left: originLeft, top: originTop } = topLeftOnGrid({ centerX, centerY, widthInDots, heightInDots, dotSize });

  const transform = useDerivedValue(() => {
    'worklet';
    const point = pointOnDial(centerX, centerY, radius, minutes.value * 6);
    const placed = topLeftOnGrid({ centerX: point.x, centerY: point.y, widthInDots, heightInDots, dotSize });

    return [{ translateX: (placed.left - originLeft) * dotSize }, { translateY: (placed.top - originTop) * dotSize }];
  });

  return (
    <Group transform={transform}>
      <DotSprite grid={grid} centerX={centerX} centerY={centerY} dotSize={dotSize} />
    </Group>
  );
});

Thumb.displayName = 'Thumb';
