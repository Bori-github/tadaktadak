import { memo } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { COLORS, DOT_SIZE, ROUND_BUTTON_DIAMETER_IN_DOTS } from '@/shared/constants';

import { RectIconShape, type RectIcon } from '@/shared/ui/dot-icon';
import { circleCells, DotCells } from '@/shared/ui/dot-shape';

import { DotPressable } from './DotPressable';
import { getRoleColors } from './roleColors';

const CELLS = circleCells(ROUND_BUTTON_DIAMETER_IN_DOTS);

type RoundDotButtonProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  icon: RectIcon;
  disabled?: boolean;
  onPress: () => void;
  onPressIn?: () => void;
  /** 버튼 위치를 지정하는 스타일 */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const RoundDotButton = memo(({ dotSize, icon, disabled = false, onPress, onPressIn, style, testID }: RoundDotButtonProps) => {
  const size = ROUND_BUTTON_DIAMETER_IN_DOTS * dotSize;

  const iconColor = disabled ? COLORS.icon.disabled : COLORS.icon.default;

  // 아이콘 좌표가 배율 1 기준. 지금 도트 크기가 배율 1의 몇 배인지가 곱할 값
  const scale = dotSize / DOT_SIZE;
  const iconOffset = (size - icon.boxSize * scale) / 2;

  return (
    <DotPressable size={size} disabled={disabled} style={style} testID={testID} onPress={onPress} onPressIn={onPressIn}>
      {(active) => {
        const offsetY = active ? dotSize : 0;

        return (
          // active 상태의 y 오프셋만큼 캔버스 높이를 늘려 하단 클리핑 방지
          <Canvas style={[styles.canvas, { width: size, height: size + dotSize }]} pointerEvents="none">
            <DotCells cells={CELLS} dotSize={dotSize} colors={getRoleColors({ disabled, active })} offsetY={offsetY} />
            <RectIconShape icon={icon} left={iconOffset} top={offsetY + iconOffset} dotSize={dotSize} color={iconColor} />
          </Canvas>
        );
      }}
    </DotPressable>
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
