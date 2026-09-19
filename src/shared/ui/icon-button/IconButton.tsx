import { memo } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { BUTTON_TOUCH_PADDING, COLORS, DOT_SIZE } from '@/shared/constants';

/** 배율 1의 논리 픽셀. 피그마 `button-modal-close` */
const DIAMETER = 28;
const STROKE_THICKNESS = 1.5;

type Stroke = { length: number; rotation: number };

export const CLOSE_STROKES: readonly Stroke[] = [
  { length: 10, rotation: 45 },
  { length: 10, rotation: -45 },
];

type IconButtonProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  strokes: readonly Stroke[];
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const IconButton = memo(({ dotSize, strokes, onPress, style, testID }: IconButtonProps) => {
  const scale = dotSize / DOT_SIZE;
  const size = DIAMETER * scale;
  const thickness = STROKE_THICKNESS * scale;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      style={[style, styles.circle, { width: size, height: size, borderRadius: size / 2 }]}
      hitSlop={BUTTON_TOUCH_PADDING / 2}
      onPress={onPress}
    >
      {strokes.map(({ length, rotation }) => (
        <View key={rotation} style={[styles.stroke, { width: length * scale, height: thickness, borderRadius: thickness / 2, transform: [{ rotate: `${rotation}deg` }] }]} />
      ))}
    </Pressable>
  );
});

IconButton.displayName = 'IconButton';

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.iconButton.background,
  },
  stroke: {
    position: 'absolute',
    backgroundColor: COLORS.iconButton.icon,
  },
});
