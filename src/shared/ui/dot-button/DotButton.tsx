import { memo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';

import { BUTTON_SIZE_IN_DOTS, BUTTON_TOUCH_PADDING, COLORS } from '@/shared/constants';
import { playVibration } from '@/shared/lib';

import { type GridIcon } from '@/shared/ui/dot-icon';
import { DotSprite } from '@/shared/ui/dot-sprite';

import { type DotRole } from './circle';
import { rectangleCells } from './rectangle';
import { DISABLED_ROLE_COLORS, ROLE_COLORS } from './roleColors';

const CELLS = rectangleCells({ widthInDots: BUTTON_SIZE_IN_DOTS, heightInDots: BUTTON_SIZE_IN_DOTS });

const ICON_COLORS = { I: COLORS.icon.default };
const DISABLED_ICON_COLORS = { I: COLORS.icon.disabled };

type DotButtonFaceProps = {
  dotSize: number;
  icon: GridIcon;
  disabled: boolean;
  pressed: boolean;
};

const DotButtonFace = memo(({ dotSize, icon, disabled, pressed }: DotButtonFaceProps) => {
  const size = BUTTON_SIZE_IN_DOTS * dotSize;
  // press 도중 disabled로 전환되면 active 상태를 그리지 않음
  const active = pressed && !disabled;
  const offsetY = active ? dotSize : 0;

  const colors = disabled ? DISABLED_ROLE_COLORS : ROLE_COLORS;
  const roleColor = (role: DotRole) => (active && role === 'highlight' ? colors.face : colors[role]);

  return (
    // active 상태의 y 오프셋만큼 캔버스 높이를 늘려 하단 클리핑 방지
    <Canvas style={[styles.canvas, { width: size, height: size + dotSize }]} pointerEvents="none">
      <Group antiAlias={false}>
        {CELLS.map((cell) => (
          <Rect
            key={cell.key}
            x={cell.column * dotSize}
            y={offsetY + cell.row * dotSize}
            width={cell.widthInDots * dotSize}
            height={cell.heightInDots * dotSize}
            color={roleColor(cell.role)}
          />
        ))}
        <DotSprite grid={icon} centerX={size / 2} centerY={offsetY + size / 2} dotSize={dotSize} colors={disabled ? DISABLED_ICON_COLORS : ICON_COLORS} />
      </Group>
    </Canvas>
  );
});

DotButtonFace.displayName = 'DotButtonFace';

type DotButtonProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  icon: GridIcon;
  disabled?: boolean;
  onPress: () => void;
  /** 버튼 위치를 지정하는 스타일 */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const DotButton = memo(({ dotSize, icon, disabled = false, onPress, style, testID }: DotButtonProps) => {
  const size = BUTTON_SIZE_IN_DOTS * dotSize;

  return (
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
      {({ pressed }) => <DotButtonFace dotSize={dotSize} icon={icon} disabled={disabled} pressed={pressed} />}
    </Pressable>
  );
});

DotButton.displayName = 'DotButton';

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
