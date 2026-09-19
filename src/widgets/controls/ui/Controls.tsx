import { memo } from 'react';

import { buttonCentersX, type ControlButton } from '../lib/layout';
import { isStopEnabled, playIcon } from '../lib/state';

import { type TimerPhase } from '@/entities/timer';
import { DotButton } from '@/shared/ui/dot-button';
import { STOP_ICON } from '@/shared/ui/dot-icon';

type ControlsProps = {
  centerX: number;
  centerY: number;
  dotSize: number;
  phase: TimerPhase;
  /** 지금 눌려 있는 버튼. 없으면 `null` */
  pressed: ControlButton | null;
};

export const Controls = memo(({ centerX, centerY, dotSize, phase, pressed }: ControlsProps) => {
  const centers = buttonCentersX(centerX, dotSize);

  return (
    <>
      <DotButton centerX={centers.play} centerY={centerY} dotSize={dotSize} icon={playIcon(phase)} pressed={pressed === 'play'} />
      <DotButton centerX={centers.stop} centerY={centerY} dotSize={dotSize} icon={STOP_ICON} disabled={!isStopEnabled(phase)} pressed={pressed === 'stop'} />
    </>
  );
});

Controls.displayName = 'Controls';
