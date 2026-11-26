import { useMemo, type JSX } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, ImageSVG, Skia } from '@shopify/react-native-skia';

import { BUTTON_TOUCH_PADDING, DOT_SIZE } from '@/shared/constants';
import { usePalette } from '@/shared/lib';

/** 배율 1의 논리 픽셀. 피그마 `button-modal-close` */
const DIAMETER = 28;

type IconButtonProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  /** 아이콘 색을 받아 SVG 마크업을 만드는 함수 */
  icon: (color: string) => string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const IconButton = ({ dotSize, icon, onPress, style, testID }: IconButtonProps): JSX.Element => {
  const color = usePalette().icon.default;
  const svg = useMemo(() => Skia.SVG.MakeFromString(icon(color)), [icon, color]);
  const size = (DIAMETER * dotSize) / DOT_SIZE;

  return (
    <Pressable testID={testID} accessibilityRole="button" style={[style, { width: size, height: size }]} hitSlop={BUTTON_TOUCH_PADDING / 2} onPress={onPress}>
      <Canvas style={StyleSheet.absoluteFill}>
        <ImageSVG svg={svg} width={size} height={size} />
      </Canvas>
    </Pressable>
  );
};
