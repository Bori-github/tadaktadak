import { COLORS } from '@/shared/constants';
import { DotNumber } from '@/shared/ui';

/** 집중 숫자 배율. 5×7 자형이 21 도트가 된다. `DESIGN.md` §3 */
const FOCUS_GLYPH_SCALE = 3;
const FOCUS_HEIGHT_IN_DOTS = 21;
const REST_HEIGHT_IN_DOTS = 7;

/** 두 숫자 사이 (dot). `DESIGN.md` §5 */
const READOUT_GAP_IN_DOTS = 10;

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
  const gapInDots = FOCUS_HEIGHT_IN_DOTS / 2 + READOUT_GAP_IN_DOTS + REST_HEIGHT_IN_DOTS / 2;

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
        centerY={centerY + gapInDots * dotSize}
        color={COLORS.rest.text}
        dotSize={dotSize}
        opacity={active === 'rest' ? 1 : INACTIVE_OPACITY}
      />
    </>
  );
};
