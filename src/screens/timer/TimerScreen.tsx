import { Canvas, Fill } from '@shopify/react-native-skia';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TickNumbers } from '@/widgets/dial';
import { COLORS } from '@/shared/constants';
import { resolveLayout } from '@/shared/lib';

export function TimerScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const layout = resolveLayout({
    shortSide: Math.min(width, height),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
  });

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color={COLORS.canvas} />
        <TickNumbers centerX={width / 2} centerY={layout.dialCenterY} radius={layout.tickNumberRadius} dotSize={layout.dotSize} />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
});
