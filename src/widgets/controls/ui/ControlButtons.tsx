import { type JSX } from 'react';
import { Pressable } from 'react-native';

import { buttonCentersX, buttonTouchSize, type ControlButton } from '../lib/layout';
import { controlsState } from '../lib/state';

import { type TimerPhase } from '@/entities/timer';

const touchArea = (centerX: number, centerY: number, dotSize: number) => {
  const size = buttonTouchSize(dotSize);

  return {
    position: 'absolute',
    left: centerX - size / 2,
    top: centerY - size / 2,
    width: size,
    height: size,
  } as const;
};

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
  const { playEnabled, stopEnabled } = controlsState(phase);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={touchArea(centers.play, centerY, dotSize)}
        disabled={!playEnabled}
        onPressIn={() => onPressedChange('play')}
        onPressOut={() => onPressedChange(null)}
        onPress={onPlay}
      />
      <Pressable
        accessibilityRole="button"
        style={touchArea(centers.stop, centerY, dotSize)}
        disabled={!stopEnabled}
        onPressIn={() => onPressedChange('stop')}
        onPressOut={() => onPressedChange(null)}
        onPress={onStop}
      />
    </>
  );
};
