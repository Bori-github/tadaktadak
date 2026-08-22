import { FOCUS_GLYPH_SCALE, REST_OFFSET_IN_DOTS } from '../config/readout';
import { COLORS } from '@/shared/constants';
import { DotNumber } from '@/shared/ui/dot-number';

const INACTIVE_OPACITY = 0.4;

const toClock = (minutes: number) => `${String(minutes).padStart(2, '0')}:00`;

type DialReadoutProps = {
  centerX: number;
  centerY: number;
  dotSize: number;
  focusMinutes: number;
  restMinutes: number;
  /** 지금 세고 있거나 편집 대상인 쪽. `DESIGN.md` §3 */
  active: 'focus' | 'rest';
};

export const DialReadout = ({ centerX, centerY, dotSize, focusMinutes, restMinutes, active }: DialReadoutProps) => {
  return (
    <>
      <DotNumber
        text={toClock(focusMinutes)}
        centerX={centerX}
        centerY={centerY}
        color={COLORS.focus.text}
        dotSize={dotSize}
        glyphScale={FOCUS_GLYPH_SCALE}
        opacity={active === 'focus' ? 1 : INACTIVE_OPACITY}
      />
      <DotNumber
        text={toClock(restMinutes)}
        centerX={centerX}
        centerY={centerY + REST_OFFSET_IN_DOTS * dotSize}
        color={COLORS.rest.text}
        dotSize={dotSize}
        opacity={active === 'rest' ? 1 : INACTIVE_OPACITY}
      />
    </>
  );
};
