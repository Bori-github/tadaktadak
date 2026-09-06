import { memo } from 'react';

import { buttonCentersX, type ControlButton } from '../lib/layout';
import { controlsState } from '../lib/state';

import { type TimerPhase } from '@/entities/timer';
import { DotButton, STOP_ICON } from '@/shared/ui/dot-button';

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
  const { playIcon, stopEnabled } = controlsState(phase);

  return (
    <>
      <DotButton centerX={centers.play} centerY={centerY} dotSize={dotSize} icon={playIcon} pressed={pressed === 'play'} />
      <DotButton centerX={centers.stop} centerY={centerY} dotSize={dotSize} icon={STOP_ICON} enabled={stopEnabled} pressed={pressed === 'stop'} />
    </>
  );
});

Controls.displayName = 'Controls';
