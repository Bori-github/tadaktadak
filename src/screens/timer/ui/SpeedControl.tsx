import { type JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/constants';

const TIMER_SPEEDS = [1, 5, 10, 50];

type SpeedControlProps = {
  speed: number;
  /** 배속을 변경할 수 있는지 여부.*/
  enabled: boolean;
  onSelect: (speed: number) => void;
};

/** 개발 빌드에서만 그리는 배속 조작 */
export const SpeedControl = ({ speed, enabled, onSelect }: SpeedControlProps): JSX.Element => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.row, { bottom: insets.bottom + 8 }, enabled ? null : styles.locked]} pointerEvents={enabled ? 'auto' : 'none'}>
      {TIMER_SPEEDS.map((option) => (
        <Pressable key={option} style={[styles.item, option === speed && styles.selected]} onPress={() => onSelect(option)}>
          <Text style={styles.label}>{option}×</Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.button.lockedFace,
  },
  selected: {
    backgroundColor: COLORS.focus.arc,
  },
  locked: {
    opacity: 0.4,
  },
  label: {
    color: COLORS.focus.text,
    fontSize: 12,
  },
});
