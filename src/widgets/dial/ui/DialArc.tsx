import { Path, Skia } from '@shopify/react-native-skia';
import { memo, useMemo } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import { type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';

/** 호 두께 (dot) */
const ARC_WIDTH_IN_DOTS = 3;

/** 시계판 한 바퀴 (분). `DESIGN.md` §7 */
const MINUTES_IN_TURN = 60;

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
  // 프레임마다 만들면 UI 스레드가 밀려, 호 한 바퀴를 미리 만들고 끝점만 옮김
  const turn = useMemo(() => {
    // addArc에서 0도는 3시 방향이라 보정
    return Skia.PathBuilder.Make()
      .addArc(Skia.XYWHRect(centerX - radius, centerY - radius, radius * 2, radius * 2), -90, 360)
      .build();
  }, [centerX, centerY, radius]);

  const end = useDerivedValue(() => {
    'worklet';
    return minutes.value / MINUTES_IN_TURN;
  });

  return <Path path={turn} start={0} end={end} color={COLORS[mode].arc} style="stroke" strokeWidth={ARC_WIDTH_IN_DOTS * dotSize} />;
});

DialArc.displayName = 'DialArc';
