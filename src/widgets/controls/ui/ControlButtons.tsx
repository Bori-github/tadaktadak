import { memo } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { playIcon } from '../lib/state';

import { isReadyPhase, type TimerPhase } from '@/entities/timer';
import { BUTTON_SIZE_IN_DOTS } from '@/shared/constants';
import { DotButton } from '@/shared/ui/dot-button';
import { STOP_ICON } from '@/shared/ui/dot-icon';

/** 두 버튼 중심 간 거리 (dot). `DESIGN.md` §5 */
const CENTER_DISTANCE_IN_DOTS = 44;

type ControlButtonsProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  phase: TimerPhase;
  onPlay: () => void;
  onStop: () => void;
  /** 버튼 줄 위치를 지정하는 스타일 */
  style?: StyleProp<ViewStyle>;
};

export const ControlButtons = memo(({ dotSize, phase, onPlay, onStop, style }: ControlButtonsProps) => (
  <View style={[styles.row, { gap: (CENTER_DISTANCE_IN_DOTS - BUTTON_SIZE_IN_DOTS) * dotSize }, style]} pointerEvents="box-none">
    <DotButton testID="controls-play" dotSize={dotSize} icon={playIcon(phase)} onPress={onPlay} />
    <DotButton testID="controls-stop" dotSize={dotSize} icon={STOP_ICON} disabled={isReadyPhase(phase)} onPress={onStop} />
  </View>
));

ControlButtons.displayName = 'ControlButtons';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
});
