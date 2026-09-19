import { memo } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';

import { BUTTON_SIZE_IN_DOTS, BUTTON_TOUCH_PADDING, COLORS } from '@/shared/constants';
import { playVibration } from '@/shared/lib';

import { type GridIcon } from '@/shared/ui/dot-icon';
import { DotSprite } from '@/shared/ui/dot-sprite';

/** 리벳이 놓이는 모서리 안쪽 거리 (dot) */
const RIVET_INSET = 3;

const RIVETS: readonly (readonly [number, number])[] = [
  [RIVET_INSET, RIVET_INSET],
  [BUTTON_SIZE_IN_DOTS - 1 - RIVET_INSET, RIVET_INSET],
  [RIVET_INSET, BUTTON_SIZE_IN_DOTS - 1 - RIVET_INSET],
  [BUTTON_SIZE_IN_DOTS - 1 - RIVET_INSET, BUTTON_SIZE_IN_DOTS - 1 - RIVET_INSET],
];

const ICON_COLORS = { I: COLORS.button.icon };
const DISABLED_ICON_COLORS = { I: COLORS.button.lockedIcon };

type Cell = { key: string; x: number; y: number; width: number; height: number; color: string };

const buttonCells = (disabled: boolean, pressed: boolean): Cell[] => {
  const size = BUTTON_SIZE_IN_DOTS;
  const { highlight } = COLORS.button;
  const edge = disabled ? COLORS.button.lockedEdge : COLORS.button.edge;
  const face = disabled ? COLORS.button.lockedFace : COLORS.button.face;
  const shadow = disabled ? COLORS.button.lockedShadow : COLORS.button.shadow;

  const cells: Cell[] = [
    { key: 'face', x: 0, y: 0, width: size, height: size, color: face },
    { key: 'edge-top', x: 0, y: 0, width: size, height: 1, color: edge },
    { key: 'edge-bottom', x: 0, y: size - 1, width: size, height: 1, color: edge },
    { key: 'edge-left', x: 0, y: 0, width: 1, height: size, color: edge },
    { key: 'edge-right', x: size - 1, y: 0, width: 1, height: size, color: edge },
  ];

  if (!disabled && !pressed) {
    cells.push(
      { key: 'highlight-top', x: 1, y: 1, width: size - 2, height: 1, color: highlight },
      { key: 'highlight-left', x: 1, y: 1, width: 1, height: size - 2, color: highlight },
    );
  }

  // 그림자는 하이라이트보다 나중에 그림. 겹치는 도트 두 칸 (1, size-2)·(size-2, 1)은 그림자 색
  cells.push(
    { key: 'shadow-bottom', x: 1, y: size - 2, width: size - 2, height: 1, color: shadow },
    { key: 'shadow-right', x: size - 2, y: 1, width: 1, height: size - 2, color: shadow },
  );

  for (const [x, y] of RIVETS) {
    cells.push({ key: `rivet-${x}-${y}`, x, y, width: 1, height: 1, color: edge });
  }

  return cells;
};

type DotButtonFaceProps = {
  dotSize: number;
  icon: GridIcon;
  disabled: boolean;
  pressed: boolean;
};

// onPress 참조가 바뀌어도 Canvas가 리렌더링되지 않도록 memo로 분리
const DotButtonFace = memo(({ dotSize, icon, disabled, pressed }: DotButtonFaceProps) => {
  const size = BUTTON_SIZE_IN_DOTS * dotSize;
  const offsetY = pressed ? dotSize : 0;

  return (
    // active 상태의 y 오프셋만큼 캔버스 높이를 늘려 하단 클리핑 방지
    <Canvas style={[styles.canvas, { width: size, height: size + dotSize }]} pointerEvents="none">
      <Group antiAlias={false}>
        {buttonCells(disabled, pressed).map((cell) => (
          <Rect key={cell.key} x={cell.x * dotSize} y={offsetY + cell.y * dotSize} width={cell.width * dotSize} height={cell.height * dotSize} color={cell.color} />
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
