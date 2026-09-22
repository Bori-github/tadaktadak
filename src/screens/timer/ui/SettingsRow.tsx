import { type JSX, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { DOT_SIZE } from '@/shared/constants';

/** 배율 1의 논리 픽셀. 피그마 `모달 · 설정` */
const FIRST_ROW_TOP = 52;
const ROW_HEIGHT = 56;
const BOTTOM_PADDING = 20;

type SettingsRowProps = {
  index: number;
  dotSize: number;
  onPress?: () => void;
  testID?: string;
  children: ReactNode;
};

export const SettingsRow = ({ index, dotSize, onPress, testID, children }: SettingsRowProps): JSX.Element => {
  const scale = dotSize / DOT_SIZE;
  const rowStyle = { top: (FIRST_ROW_TOP + index * ROW_HEIGHT) * scale, height: ROW_HEIGHT * scale, paddingHorizontal: 20 * scale };

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

/**
 * 마지막 행 아래 여백까지 담는 모달 패널 높이
 *
 * @param rowCount - 패널에 들어가는 행 수
 * @returns 패널 높이 (도트)
 */
export const getPanelHeightInDots = (rowCount: number): number => (FIRST_ROW_TOP + rowCount * ROW_HEIGHT + BOTTOM_PADDING) / DOT_SIZE;
