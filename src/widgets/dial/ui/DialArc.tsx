import { Path, Skia } from '@shopify/react-native-skia';

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
  minutes: number;
  mode: TimerMode;
};

export const DialArc = ({ centerX, centerY, radius, dotSize, minutes, mode }: DialArcProps) => {
  if (minutes <= 0) return null;

  // addArc에서 0도는 3시 방향을 가리키므로 보정한다
  const path = Skia.PathBuilder.Make()
    .addArc(Skia.XYWHRect(centerX - radius, centerY - radius, radius * 2, radius * 2), -90, minutes * 6)
    .build();

  return <Path path={path} color={COLORS[mode].arc} style="stroke" strokeWidth={ARC_WIDTH_IN_DOTS * dotSize} />;
};
