import { type JSX, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RemainingSeconds } from './RemainingSeconds';
import { SpeedControl } from './SpeedControl';

import { COLORS } from '@/shared/constants';

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
  const [hasThrown, setHasThrown] = useState(false);

  // Error Boundary가 이벤트 핸들러 에러를 잡지 않아 렌더 중 throw
  if (hasThrown) throw new Error('개발 패널에서 발생시킨 테스트 에러');

  return (
    <View style={[styles.panel, { bottom: insets.bottom + 8 }]}>
      {seconds === null ? null : <RemainingSeconds seconds={seconds} />}
      <View style={styles.row}>
        <SpeedControl speed={speed} enabled={isSpeedEnabled} onSelect={onSelectSpeed} />
        <Pressable testID="throw-error" style={styles.errorButton} onPress={() => setHasThrown(true)}>
          <Text style={styles.label}>에러</Text>
        </Pressable>
      </View>
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
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  errorButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.fire.base,
  },
  label: {
    color: COLORS.focus.text,
    fontSize: 12,
  },
});
