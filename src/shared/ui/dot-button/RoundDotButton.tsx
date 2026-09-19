import { memo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';

import { BUTTON_TOUCH_PADDING, COLORS, DOT_SIZE, ROUND_BUTTON_DIAMETER_IN_DOTS } from '@/shared/constants';
import { playVibration } from '@/shared/lib';

import { type RectIcon } from '@/shared/ui/dot-icon';

import { circleCells, type DotRole } from './circle';

const CELLS = circleCells(ROUND_BUTTON_DIAMETER_IN_DOTS);

const ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.edge,
  face: COLORS.button.face,
  highlight: COLORS.button.highlight,
  shadow: COLORS.button.shadow,
};

const DISABLED_ROLE_COLORS: Record<DotRole, string> = {
  edge: COLORS.button.lockedEdge,
  face: COLORS.button.lockedFace,
  highlight: COLORS.button.lockedFace,
  shadow: COLORS.button.lockedShadow,
};

type RoundDotButtonProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  icon: RectIcon;
  disabled?: boolean;
  onPress: () => void;
  /** 버튼 위치를 지정하는 스타일 */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const RoundDotButton = memo(({ dotSize, icon, disabled = false, onPress, style, testID }: RoundDotButtonProps) => {
  const size = ROUND_BUTTON_DIAMETER_IN_DOTS * dotSize;

  const colors = disabled ? DISABLED_ROLE_COLORS : ROLE_COLORS;
  const iconColor = disabled ? COLORS.button.lockedIcon : COLORS.button.icon;

  // 아이콘 좌표가 배율 1 기준. 지금 도트 크기가 배율 1의 몇 배인지가 곱할 값
  const scale = dotSize / DOT_SIZE;
  const iconOffset = (size - icon.boxSize * scale) / 2;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      style={[style, { width: size, height: size }]}
      hitSlop={BUTTON_TOUCH_PADDING / 2}
      disabled={disabled}
      onPressIn={() => playVibration()}
      onPress={() => {
        if (disabled) return;
        onPress();
      }}
    >
      {({ pressed }) => {
        const offsetY = pressed ? dotSize : 0;
        const roleColor = (role: DotRole) => (pressed && role === 'highlight' ? colors.face : colors[role]);

        return (
          // active 상태의 y 오프셋만큼 캔버스 높이를 늘려 하단 클리핑 방지
          <Canvas style={[styles.canvas, { width: size, height: size + dotSize }]} pointerEvents="none">
            <Group antiAlias={false}>
              {CELLS.map((cell) => (
                <Rect
                  key={`${cell.column}-${cell.row}`}
                  x={cell.column * dotSize}
                  y={offsetY + cell.row * dotSize}
                  width={cell.widthInDots * dotSize}
                  height={dotSize}
                  color={roleColor(cell.role)}
                />
              ))}
              {icon.rects.map(([x, y, width, height]) => (
                <Rect
                  key={`${x}-${y}-${width}-${height}`}
                  x={iconOffset + x * scale}
                  y={offsetY + iconOffset + y * scale}
                  width={width * scale}
                  height={height * scale}
                  color={iconColor}
                />
              ))}
            </Group>
          </Canvas>
        );
      }}
    </Pressable>
  );
});

RoundDotButton.displayName = 'RoundDotButton';

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
