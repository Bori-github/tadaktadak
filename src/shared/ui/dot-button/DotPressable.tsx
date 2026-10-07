import { type JSX, type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { BUTTON_TOUCH_PADDING } from '@/shared/constants';

type DotPressableProps = {
  /** 버튼 가로 (px) */
  size: number;
  /** 버튼 세로 (px). 없으면 `size`와 같음 */
  height?: number;
  disabled: boolean;
  onPress: () => void;
  onPressIn?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: (active: boolean) => ReactNode;
};

export const DotPressable = ({ size, height = size, disabled, onPress, onPressIn, style, testID, children }: DotPressableProps): JSX.Element => (
  <Pressable
    testID={testID}
    accessibilityRole="button"
    style={[style, { width: size, height }]}
    hitSlop={BUTTON_TOUCH_PADDING / 2}
    disabled={disabled}
    android_disableSound={disabled}
    onPressIn={onPressIn}
    onPress={() => {
      if (disabled) return;
      onPress();
    }}
  >
    {/* press 도중 disabled로 전환되면 active 상태를 그리지 않음 */}
    {({ pressed }) => children(pressed && !disabled)}
  </Pressable>
);
