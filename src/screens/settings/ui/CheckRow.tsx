import { type JSX } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { DOT_SIZE } from '@/shared/constants';
import { usePalette } from '@/shared/lib';

import { CHECK_ICON } from '@/shared/ui/dot-icon';
import { DotModalRow } from '@/shared/ui/dot-modal';
import { DotSprite } from '@/shared/ui/dot-sprite';

type CheckRowProps = {
  dotSize: number;
  name: string;
  description?: string;
  checked: boolean;
  onPress: () => void;
  testID: string;
};

export const CheckRow = ({ dotSize, name, description, checked, onPress, testID }: CheckRowProps): JSX.Element => {
  const palette = usePalette();
  const scale = dotSize / DOT_SIZE;

  const checkWidth = (CHECK_ICON[0]?.length ?? 0) * dotSize;
  const checkHeight = CHECK_ICON.length * dotSize;
  const checkToName = 12 * scale;

  return (
    <DotModalRow dotSize={dotSize} testID={testID} onPress={onPress}>
      <View style={styles.column}>
        <View style={styles.line}>
          <View style={{ width: checkWidth, height: checkHeight, marginRight: checkToName }}>
            {!checked ? null : (
              <Canvas style={StyleSheet.absoluteFill}>
                <DotSprite grid={CHECK_ICON} centerX={checkWidth / 2} centerY={checkHeight / 2} dotSize={dotSize} colors={{ I: palette.icon.check }} />
              </Canvas>
            )}
          </View>
          <Text style={[styles.name, { fontSize: 16 * scale, color: checked ? palette.text.primary : palette.text.secondary }]}>{name}</Text>
        </View>
        {description === undefined ? null : (
          <Text style={{ color: palette.text.tertiary, fontSize: 13 * scale, marginTop: 4 * scale, marginLeft: checkWidth + checkToName }}>{description}</Text>
        )}
      </View>
    </DotModalRow>
  );
};

const styles = StyleSheet.create({
  column: {
    flex: 1,
  },
  line: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flex: 1,
  },
});
