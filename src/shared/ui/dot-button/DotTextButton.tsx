import { memo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { COLORS } from '@/shared/constants';

import { DotCells, rectangleCells } from '@/shared/ui/dot-shape';

import { DotPressable } from './DotPressable';
import { getRoleColors } from './roleColors';

type DotTextButtonProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  widthInDots: number;
  heightInDots: number;
  label: string;
  onPress: () => void;
  /** 버튼 위치를 지정하는 스타일 */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export const DotTextButton = memo(({ dotSize, widthInDots, heightInDots, label, onPress, style, testID }: DotTextButtonProps) => {
  const width = widthInDots * dotSize;
  const height = heightInDots * dotSize;
  const cells = rectangleCells({ widthInDots, heightInDots });

  return (
    <DotPressable size={width} height={height} disabled={false} style={style} testID={testID} onPress={onPress}>
      {(active) => {
        const offsetY = active ? dotSize : 0;

        return (
          <>
            {/* active 상태의 y 오프셋만큼 캔버스 높이를 늘려 하단 클리핑 방지 */}
            <Canvas style={[styles.canvas, { width, height: height + dotSize }]} pointerEvents="none">
              <DotCells cells={cells} dotSize={dotSize} colors={getRoleColors({ disabled: false, active })} offsetY={offsetY} />
            </Canvas>
            <View style={[styles.labelBox, { width, height, top: offsetY }]} pointerEvents="none">
              <Text style={styles.label}>{label}</Text>
            </View>
          </>
        );
      }}
    </DotPressable>
  );
});

DotTextButton.displayName = 'DotTextButton';

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  labelBox: {
    position: 'absolute',
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: COLORS.text.primary,
    fontSize: 16,
  },
});
