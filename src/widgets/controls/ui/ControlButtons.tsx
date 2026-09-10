import { memo } from 'react';
import { Pressable } from 'react-native';

import { buttonCentersX, buttonTouchSize, type ControlButton } from '../lib/layout';
import { isStopEnabled } from '../lib/state';

import { type TimerPhase } from '@/entities/timer';
import { playVibration, touchArea } from '@/shared/lib';

type ControlButtonsProps = {
  centerX: number;
  centerY: number;
  dotSize: number;
  phase: TimerPhase;
  onPlay: () => void;
  onStop: () => void;
  onPressedChange: (button: ControlButton | null) => void;
};

export const ControlButtons = memo(({ centerX, centerY, dotSize, phase, onPlay, onStop, onPressedChange }: ControlButtonsProps) => {
  const centers = buttonCentersX(centerX, dotSize);
  const size = buttonTouchSize(dotSize);

  const handlePressIn = (button: ControlButton) => {
    playVibration();
    onPressedChange(button);
  };

  return (
    <>
      <Pressable
        testID="controls-play"
        accessibilityRole="button"
        style={touchArea({ centerX: centers.play, centerY, size })}
        onPressIn={() => handlePressIn('play')}
        onPressOut={() => onPressedChange(null)}
        onPress={onPlay}
      />
      <Pressable
        testID="controls-stop"
        accessibilityRole="button"
        style={touchArea({ centerX: centers.stop, centerY, size })}
        disabled={!isStopEnabled(phase)}
        onPressIn={() => handlePressIn('stop')}
        onPressOut={() => onPressedChange(null)}
        onPress={onStop}
      />
    </>
  );
});

ControlButtons.displayName = 'ControlButtons';
