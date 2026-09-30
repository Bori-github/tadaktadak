import { type JSX, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DOT_SIZE } from '@/shared/constants';

/** 배율 1의 논리 픽셀. 피그마 `설정 화면 · 페이지` */
const ROW_HEIGHT = 56;

type SettingsRowProps = {
  dotSize: number;
  onPress?: () => void;
  testID?: string;
  children: ReactNode;
};

export const SettingsRow = ({ dotSize, onPress, testID, children }: SettingsRowProps): JSX.Element => {
  const scale = dotSize / DOT_SIZE;
  const rowStyle = { height: ROW_HEIGHT * scale, paddingHorizontal: 20 * scale };

  if (onPress === undefined) return <View style={[styles.row, rowStyle]}>{children}</View>;

  return (
    <Pressable testID={testID} accessibilityRole="button" style={[styles.row, rowStyle]} onPress={onPress}>
      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
