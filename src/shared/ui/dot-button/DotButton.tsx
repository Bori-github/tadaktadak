import { memo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { BUTTON_SIZE_IN_DOTS, COLORS } from '@/shared/constants';

import { type GridIcon } from '@/shared/ui/dot-icon';
import { DotCells, rectangleCells } from '@/shared/ui/dot-shape';
import { DotSprite } from '@/shared/ui/dot-sprite';

import { DotPressable } from './DotPressable';
import { getRoleColors } from './roleColors';

const CELLS = rectangleCells({ widthInDots: BUTTON_SIZE_IN_DOTS, heightInDots: BUTTON_SIZE_IN_DOTS });

const ICON_COLORS = { I: COLORS.icon.default };
const DISABLED_ICON_COLORS = { I: COLORS.icon.disabled };

type DotButtonFaceProps = {
  dotSize: number;
  icon: GridIcon;
  disabled: boolean;
  active: boolean;
};

const DotButtonFace = memo(({ dotSize, icon, disabled, active }: DotButtonFaceProps) => {
  const size = BUTTON_SIZE_IN_DOTS * dotSize;
  const offsetY = active ? dotSize : 0;

  return (
    // active 상태의 y 오프셋만큼 캔버스 높이를 늘려 하단 클리핑 방지
    <Canvas style={[styles.canvas, { width: size, height: size + dotSize }]} pointerEvents="none">
      <DotCells cells={CELLS} dotSize={dotSize} colors={getRoleColors({ disabled, active })} offsetY={offsetY} />
      <DotSprite grid={icon} centerX={size / 2} centerY={offsetY + size / 2} dotSize={dotSize} colors={disabled ? DISABLED_ICON_COLORS : ICON_COLORS} />
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
    <DotPressable size={size} disabled={disabled} style={style} testID={testID} onPress={onPress}>
      {(active) => <DotButtonFace dotSize={dotSize} icon={icon} disabled={disabled} active={active} />}
    </DotPressable>
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
