import { pointOnDial } from '../lib';
import { BONFIRE_COLD_7, BONFIRE_COLD_9, DotSprite, LOG_COLD, MARKER } from '@/shared/ui';

const SLOTS = 60;

const SLOT_NUMBERS = Array.from({ length: SLOTS }, (_, index) => index + 1);

type DialItemsProps = {
  centerX: number;
  centerY: number;
  radius: number;
  dotSize: number;
  bonfireDots: number;
};

export function DialItems({ centerX, centerY, radius, dotSize, bonfireDots }: DialItemsProps) {
  const bonfire = bonfireDots === 9 ? BONFIRE_COLD_9 : BONFIRE_COLD_7;

  return (
    <>
      {SLOT_NUMBERS.map((slot) => {
        const point = pointOnDial(centerX, centerY, radius, (slot - 0.5) * 6);
        return <DotSprite key={slot} grid={slot % 5 === 0 ? bonfire : LOG_COLD} centerX={point.x} centerY={point.y} dotSize={dotSize} />;
      })}
      <DotSprite grid={MARKER} centerX={centerX} centerY={centerY - radius} dotSize={dotSize} />
    </>
  );
}
