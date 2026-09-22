import { type JSX, type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import { BUTTON_TOUCH_PADDING } from '@/shared/constants';
import { playVibration } from '@/shared/lib';

type DotPressableProps = {
  /** 버튼 한 변 (px) */
  size: number;
  disabled: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  children: (active: boolean) => ReactNode;
};

export const DotPressable = ({ size, disabled, onPress, style, testID, children }: DotPressableProps): JSX.Element => (
  <Pressable
    testID={testID}
    accessibilityRole="button"
    style={[style, { width: size, height: size }]}
    hitSlop={BUTTON_TOUCH_PADDING / 2}
    disabled={disabled}
    android_disableSound={disabled}
    onPressIn={() => playVibration()}
    onPress={() => {
      if (disabled) return;
      onPress();
    }}
  >
    {/* press 도중 disabled로 전환되면 active 상태를 그리지 않음 */}
    {({ pressed }) => children(pressed && !disabled)}
  </Pressable>
);
