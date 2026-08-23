import { Canvas, Fill } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Controls } from '@/widgets/controls';
import { DialArc, DialHandle, DialItems, DialReadout, ReadoutButtons, TickNumbers } from '@/widgets/dial';
import { TIMER_DEFAULT, type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';
import { resolveLayout } from '@/shared/lib';

export const TimerScreen = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [editTarget, setEditTarget] = useState<TimerMode>('focus');

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
        <DialArc centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={TIMER_DEFAULT[editTarget]} mode={editTarget} />
        <DialItems centerX={centerX} centerY={centerY} radius={layout.itemRadius} dotSize={layout.dotSize} bonfireDots={layout.bonfireDots} />
        <DialHandle centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={TIMER_DEFAULT[editTarget]} mode={editTarget} />
        <TickNumbers centerX={centerX} centerY={centerY} radius={layout.tickNumberRadius} dotSize={layout.dotSize} />
        <DialReadout centerX={centerX} centerY={centerY} dotSize={layout.dotSize} focusMinutes={TIMER_DEFAULT.focus} restMinutes={TIMER_DEFAULT.rest} active={editTarget} />
        <Controls centerX={centerX} centerY={layout.buttonCenterY} dotSize={layout.dotSize} />
      </Canvas>
      <ReadoutButtons centerX={centerX} centerY={centerY} dotSize={layout.dotSize} onSelect={setEditTarget} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
});
