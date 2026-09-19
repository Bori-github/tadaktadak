import { type JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { COLORS } from '@/shared/constants';

const TIMER_SPEEDS = [1, 5, 10, 50];

type SpeedControlProps = {
  speed: number;
  /** 배속을 변경할 수 있는지 여부.*/
  enabled: boolean;
  onSelect: (speed: number) => void;
};

export const SpeedControl = ({ speed, enabled, onSelect }: SpeedControlProps): JSX.Element => (
  <View style={[styles.row, enabled ? null : styles.disabled]} pointerEvents={enabled ? 'auto' : 'none'}>
    {TIMER_SPEEDS.map((option) => (
      <Pressable key={option} testID={`speed-${option}x`} style={[styles.item, option === speed && styles.selected]} onPress={() => onSelect(option)}>
        <Text style={styles.label}>{option}×</Text>
      </Pressable>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: COLORS.button.disabledFace,
  },
  selected: {
    backgroundColor: COLORS.focus.arc,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: COLORS.focus.text,
    fontSize: 12,
  },
});
