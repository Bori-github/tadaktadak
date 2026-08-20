import { Canvas, Fill } from '@shopify/react-native-skia';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Controls } from '@/widgets/controls';
import { DialArc, DialHandle, DialItems, DialReadout, TickNumbers } from '@/widgets/dial';
import { COLORS } from '@/shared/constants';
import { resolveLayout } from '@/shared/lib';

/** 집중 타이머 기본값: 25분 */
const FOCUS_MINUTES = 25;

/** 휴식 타이머 기본값: 5분 */
const REST_MINUTES = 5;

export const TimerScreen = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const layout = resolveLayout({
    shortSide: Math.min(width, height),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
  });

  const centerX = width / 2;
  const centerY = layout.dialCenterY;

  return (
    <View style={styles.root}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill color={COLORS.canvas} />
        <DialArc centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={FOCUS_MINUTES} />
        <DialItems centerX={centerX} centerY={centerY} radius={layout.itemRadius} dotSize={layout.dotSize} bonfireDots={layout.bonfireDots} />
        <DialHandle centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={FOCUS_MINUTES} />
        <TickNumbers centerX={centerX} centerY={centerY} radius={layout.tickNumberRadius} dotSize={layout.dotSize} />
        <DialReadout centerX={centerX} centerY={centerY} dotSize={layout.dotSize} focusMinutes={FOCUS_MINUTES} restMinutes={REST_MINUTES} active="focus" />
        <Controls centerX={centerX} centerY={layout.buttonCenterY} dotSize={layout.dotSize} />
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
});
