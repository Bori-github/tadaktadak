import { Path, Skia } from '@shopify/react-native-skia';
import { memo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';

/** 호 두께 (dot) */
const ARC_WIDTH_IN_DOTS = 3;

type DialArcProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  /** 12시부터 minutes만큼 시계 방향으로 그린다 */
  minutes: SharedValue<number>;
  mode: TimerMode;
};

export const DialArc = memo(({ centerX, centerY, radius, dotSize, minutes, mode }: DialArcProps) => {
  const path = useDerivedValue(() => {
    'worklet';
    // addArc에서 0도는 3시 방향이라 보정
    return Skia.PathBuilder.Make()
      .addArc(Skia.XYWHRect(centerX - radius, centerY - radius, radius * 2, radius * 2), -90, minutes.value * 6)
      .build();
  });

  return <Path path={path} color={COLORS[mode].arc} style="stroke" strokeWidth={ARC_WIDTH_IN_DOTS * dotSize} />;
});

DialArc.displayName = 'DialArc';
