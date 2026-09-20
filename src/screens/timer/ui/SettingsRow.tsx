import { type JSX, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DOT_SIZE } from '@/shared/constants';

type SettingsRowProps = {
  index: number;
  dotSize: number;
  onPress?: () => void;
  testID?: string;
  children: ReactNode;
};

export const SettingsRow = ({ index, dotSize, onPress, testID, children }: SettingsRowProps): JSX.Element => {
  const scale = dotSize / DOT_SIZE;
  // 피그마 `모달 · 설정`. 배율 1의 논리 픽셀
  const rowStyle = { top: (52 + index * 56) * scale, height: 56 * scale, paddingHorizontal: 20 * scale };

  if (onPress === undefined) return <View style={[styles.row, rowStyle]}>{children}</View>;

  return (
    <Pressable testID={testID} accessibilityRole="button" style={[styles.row, rowStyle]} onPress={onPress}>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
