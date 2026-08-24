import { FOCUS_GLYPH_SCALE, REST_OFFSET_IN_DOTS } from '../config/readout';
import { formatSecondsToClock } from '../lib/clock';
import { countdownSeconds } from '../lib/countdown';
import { type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';
import { DotNumber } from '@/shared/ui/dot-number';

const INACTIVE_OPACITY = 0.4;

type DialReadoutProps = {
  centerX: number;
  centerY: number;
  dotSize: number;
  focusMinutes: number;
  restMinutes: number;
  /** 지금 세고 있거나 편집 대상인 쪽. `DESIGN.md` §3 */
  active: TimerMode;
  /** 카운트다운 중인 남은 시간(초). 대기에서는 `null` */
  remainingSeconds: number | null;
};

export const DialReadout = ({ centerX, centerY, dotSize, focusMinutes, restMinutes, active, remainingSeconds }: DialReadoutProps) => {
  const seconds = (mode: TimerMode, minutes: number) => countdownSeconds({ mode, active, minutes, remainingSeconds });

  return (
    <>
      <DotNumber
        text={formatSecondsToClock(seconds('focus', focusMinutes))}
        centerX={centerX}
        centerY={centerY}
        color={COLORS.focus.text}
        dotSize={dotSize}
        glyphScale={FOCUS_GLYPH_SCALE}
        opacity={active === 'focus' ? 1 : INACTIVE_OPACITY}
      />
      <DotNumber
        text={formatSecondsToClock(seconds('rest', restMinutes))}
        centerX={centerX}
        centerY={centerY + REST_OFFSET_IN_DOTS * dotSize}
        color={COLORS.rest.text}
        dotSize={dotSize}
        opacity={active === 'rest' ? 1 : INACTIVE_OPACITY}
      />
    </>
  );
};
