import { BONFIRE_COLD_7, BONFIRE_COLD_9, DotSprite, LOG_COLD } from '@/shared/ui';

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
        // 각도 0을 3시에서 12시로 옮긴다
        const angle = (((slot - 0.5) * 6 - 90) * Math.PI) / 180;
        return (
          <DotSprite
            key={slot}
            grid={slot % 5 === 0 ? bonfire : LOG_COLD}
            centerX={centerX + radius * Math.cos(angle)}
            centerY={centerY + radius * Math.sin(angle)}
            dotSize={dotSize}
          />
        );
      })}
    </>
  );
}
