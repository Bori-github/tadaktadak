import { memo } from 'react';

import { pointOnDial } from '../lib/geometry';
import { type TimerMode } from '@/entities/timer';
import { DotSprite, SPARK_A, SPARK_REST } from '@/shared/ui/dot-sprite';

type DialHandleProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  /** 손잡이가 가리키는 분 */
  minutes: number;
  mode: TimerMode;
};

export const DialHandle = memo(({ centerX, centerY, radius, dotSize, minutes, mode }: DialHandleProps) => {
  const point = pointOnDial(centerX, centerY, radius, minutes * 6);

  return <DotSprite grid={mode === 'rest' ? SPARK_REST : SPARK_A} centerX={point.x} centerY={point.y} dotSize={dotSize} />;
});

DialHandle.displayName = 'DialHandle';
