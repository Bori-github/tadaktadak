import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { SettingsRow } from './SettingsRow';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { CHECK_ICON } from '@/shared/ui/dot-icon';
import { DotSprite } from '@/shared/ui/dot-sprite';

type LanguageRowProps = {
  index: number;
  dotSize: number;
  name: string;
  description?: string;
  checked: boolean;
  onPress: () => void;
  testID: string;
};

export const LanguageRow = memo(({ index, dotSize, name, description, checked, onPress, testID }: LanguageRowProps) => {
  const scale = dotSize / DOT_SIZE;

  const checkWidth = (CHECK_ICON[0]?.length ?? 0) * dotSize;
  const checkHeight = CHECK_ICON.length * dotSize;
  const checkToName = 12 * scale;

  return (
    <SettingsRow index={index} dotSize={dotSize} testID={testID} onPress={onPress}>
      <View style={styles.column}>
        <View style={styles.line}>
          <View style={{ width: checkWidth, height: checkHeight, marginRight: checkToName }}>
            {!checked ? null : (
              <Canvas style={StyleSheet.absoluteFill}>
                <DotSprite grid={CHECK_ICON} centerX={checkWidth / 2} centerY={checkHeight / 2} dotSize={dotSize} colors={{ I: COLORS.icon.check }} />
              </Canvas>
            )}
          </View>
          <Text style={[styles.name, { fontSize: 16 * scale, color: checked ? COLORS.icon.default : COLORS.icon.secondary }]}>{name}</Text>
        </View>
        {description === undefined ? null : (
          <Text style={[styles.description, { fontSize: 13 * scale, marginTop: 4 * scale, marginLeft: checkWidth + checkToName }]}>{description}</Text>
        )}
      </View>
    </SettingsRow>
  );
});

LanguageRow.displayName = 'LanguageRow';

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
  description: {
    color: COLORS.icon.disabled,
  },
});
