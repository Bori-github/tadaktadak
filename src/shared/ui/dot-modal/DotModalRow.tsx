import { type JSX, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { DOT_SIZE } from '@/shared/constants';
import { usePalette } from '@/shared/lib';

import { RectIconShape, type RectIcon } from '@/shared/ui/dot-icon';

/** 배율 1의 논리 픽셀. 피그마 `설정 화면 · 페이지` */
const ROW_HEIGHT = 56;

type DotModalRowProps = {
  dotSize: number;
  /** 행 왼쪽 끝에 그리는 아이콘 */
  icon?: RectIcon;
  onPress?: () => void;
  testID?: string;
  children: ReactNode;
};

export const DotModalRow = ({ dotSize, icon, onPress, testID, children }: DotModalRowProps): JSX.Element => {
  const palette = usePalette();
  const scale = dotSize / DOT_SIZE;
  const rowStyle = { height: ROW_HEIGHT * scale, paddingHorizontal: 20 * scale };

  const content = (
    <>
      {icon === undefined ? null : (
        <Canvas style={{ width: icon.boxSize * scale, height: icon.boxSize * scale }}>
          <RectIconShape icon={icon} left={0} top={0} dotSize={dotSize} color={palette.icon.default} />
        </Canvas>
      )}
      {children}
    </>
  );

  if (onPress === undefined) {
    return (
      <View testID={testID} style={[styles.row, rowStyle]}>
        {content}
      </View>
    );
  }

  return (
    <Pressable testID={testID} accessibilityRole="button" style={[styles.row, rowStyle]} onPress={onPress}>
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
