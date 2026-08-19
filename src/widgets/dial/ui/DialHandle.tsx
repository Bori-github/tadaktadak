import { pointOnDial } from '../lib/geometry';
import { DotSprite, SPARK_A } from '@/shared/ui/dot-sprite';

type DialHandleProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  /** 손잡이가 가리키는 분 */
  minutes: number;
};

export const DialHandle = ({ centerX, centerY, radius, dotSize, minutes }: DialHandleProps) => {
  const point = pointOnDial(centerX, centerY, radius, minutes * 6);

  return <DotSprite grid={SPARK_A} centerX={point.x} centerY={point.y} dotSize={dotSize} />;
};
