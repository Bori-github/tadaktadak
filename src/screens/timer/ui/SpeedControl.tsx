import { type JSX } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { usePalette } from '@/shared/lib';

const TIMER_SPEEDS = [1, 5, 10, 50];

type SpeedControlProps = {
  speed: number;
  /** 배속을 변경할 수 있는지 여부.*/
  enabled: boolean;
  onSelect: (speed: number) => void;
};

export const SpeedControl = ({ speed, enabled, onSelect }: SpeedControlProps): JSX.Element => {
  const palette = usePalette();

  return (
    <View style={[styles.row, enabled ? null : styles.disabled]} pointerEvents={enabled ? 'auto' : 'none'}>
      {TIMER_SPEEDS.map((option) => (
        <Pressable
          key={option}
          testID={`speed-${option}x`}
          style={[styles.item, { backgroundColor: option === speed ? palette.focus.arc : palette.button.disabledFace }]}
          onPress={() => onSelect(option)}
        >
          <Text style={[styles.label, { color: palette.focus.text }]}>{option}×</Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 6,
  },
  item: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontSize: 12,
  },
});
