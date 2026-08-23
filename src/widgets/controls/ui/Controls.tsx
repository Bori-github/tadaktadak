import { memo } from 'react';

import { buttonCentersX, type ControlButton } from '../lib/layout';

import { type TimerPhase } from '@/entities/timer';
import { DotButton } from '@/shared/ui/dot-button';

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
      <DotButton centerX={centers.play} centerY={centerY} dotSize={dotSize} icon={phase === 'running' ? 'pause' : 'play'} enabled={phase !== 'done'} pressed={pressed === 'play'} />
      <DotButton centerX={centers.stop} centerY={centerY} dotSize={dotSize} icon="stop" enabled={phase !== 'idle'} pressed={pressed === 'stop'} />
    </>
  );
});

Controls.displayName = 'Controls';
