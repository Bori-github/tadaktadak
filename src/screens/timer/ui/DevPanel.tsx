import { type JSX } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RemainingSeconds } from './RemainingSeconds';
import { SpeedControl } from './SpeedControl';

type DevPanelProps = {
  /** 대기 상태에서는 남은 시간이 없어 `null` */
  seconds: number | null;
  speed: number;
  isSpeedEnabled: boolean;
  onSelectSpeed: (speed: number) => void;
};

/** 개발 빌드용 패널 */
export const DevPanel = ({ seconds, speed, isSpeedEnabled, onSelectSpeed }: DevPanelProps): JSX.Element => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.panel, { bottom: insets.bottom + 8 }]}>
      {seconds === null ? null : <RemainingSeconds seconds={seconds} />}
      <SpeedControl speed={speed} enabled={isSpeedEnabled} onSelect={onSelectSpeed} />
    </View>
  );
};

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
  },
});
