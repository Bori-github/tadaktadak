import { pointOnDial } from '../lib/geometry';
import { COLORS } from '@/shared/constants';
import { DotNumber } from '@/shared/ui/dot-number';

const TICK_VALUES = Array.from({ length: 12 }, (_, index) => index * 5);

type TickNumbersProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
};

export const TickNumbers = ({ centerX, centerY, radius, dotSize }: TickNumbersProps) => {
  return (
    <>
      {TICK_VALUES.map((value) => {
        const point = pointOnDial(centerX, centerY, radius, value * 6);
        return <DotNumber key={value} text={String(value)} centerX={point.x} centerY={point.y} color={COLORS.focus.tick} dotSize={dotSize} />;
      })}
    </>
  );
};
