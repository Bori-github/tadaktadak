import { COLORS } from '@/shared/constants';
import { DotNumber } from '@/shared/ui';

const TICK_VALUES = Array.from({ length: 12 }, (_, index) => index * 5);

type TickNumbersProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
};

export function TickNumbers({ centerX, centerY, radius, dotSize }: TickNumbersProps) {
  return (
    <>
      {TICK_VALUES.map((value) => {
        // 각도 0을 3시에서 12시로 옮긴다
        const angle = ((value * 6 - 90) * Math.PI) / 180;
        return (
          <DotNumber
            key={value}
            text={String(value)}
            centerX={centerX + radius * Math.cos(angle)}
            centerY={centerY + radius * Math.sin(angle)}
            color={COLORS.focus.tick}
            dotSize={dotSize}
          />
        );
      })}
    </>
  );
}
