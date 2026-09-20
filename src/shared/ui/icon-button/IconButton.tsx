import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, ImageSVG, Skia } from '@shopify/react-native-skia';

import { BUTTON_TOUCH_PADDING, DOT_SIZE } from '@/shared/constants';

/** 배율 1의 논리 픽셀. 피그마 `button-modal-close` */
const DIAMETER = 28;

type IconButtonProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  /** SVG 마크업 */
  icon: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const IconButton = memo(({ dotSize, icon, onPress, style, testID }: IconButtonProps) => {
  const svg = useMemo(() => Skia.SVG.MakeFromString(icon), [icon]);
  const size = (DIAMETER * dotSize) / DOT_SIZE;

  return (
    <Pressable testID={testID} accessibilityRole="button" style={[style, { width: size, height: size }]} hitSlop={BUTTON_TOUCH_PADDING / 2} onPress={onPress}>
      <Canvas style={StyleSheet.absoluteFill}>
        <ImageSVG svg={svg} width={size} height={size} />
      </Canvas>
    </Pressable>
  );
});

IconButton.displayName = 'IconButton';
