import { type JSX } from 'react';
import { Pressable } from 'react-native';

import { buttonCentersX, buttonTouchSize, type ControlButton } from '../lib/layout';
import { isStopEnabled } from '../lib/state';

import { type TimerPhase } from '@/entities/timer';
import { touchArea } from '@/shared/lib';

type ControlButtonsProps = {
  centerX: number;
  centerY: number;
  dotSize: number;
  phase: TimerPhase;
  onPlay: () => void;
  onStop: () => void;
  onPressedChange: (button: ControlButton | null) => void;
};

export const ControlButtons = ({ centerX, centerY, dotSize, phase, onPlay, onStop, onPressedChange }: ControlButtonsProps): JSX.Element => {
  const centers = buttonCentersX(centerX, dotSize);
  const size = buttonTouchSize(dotSize);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={touchArea({ centerX: centers.play, centerY, size })}
        onPressIn={() => onPressedChange('play')}
        onPressOut={() => onPressedChange(null)}
        onPress={onPlay}
      />
      <Pressable
        accessibilityRole="button"
        style={touchArea({ centerX: centers.stop, centerY, size })}
        disabled={!isStopEnabled(phase)}
        onPressIn={() => onPressedChange('stop')}
        onPressOut={() => onPressedChange(null)}
        onPress={onStop}
      />
    </>
  );
};
