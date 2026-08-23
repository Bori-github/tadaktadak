import { Canvas, Fill } from '@shopify/react-native-skia';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Controls } from '@/widgets/controls';
import { DialArc, DialHandle, DialItems, DialReadout, ReadoutButtons, TickNumbers, useDialDrag } from '@/widgets/dial';
import { TIMER_DEFAULT, type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';
import { resolveLayout } from '@/shared/lib';

export const TimerScreen = () => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [editTarget, setEditTarget] = useState<TimerMode>('focus');
  const [minutes, setMinutes] = useState(TIMER_DEFAULT);

  const layout = resolveLayout({
    shortSide: Math.min(width, height),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
  });

  const centerX = width / 2;
  const centerY = layout.dialCenterY;
  const selected = minutes[editTarget];

  const drag = useDialDrag({
    centerX,
    centerY,
    radius: layout.arcRadius,
    dotSize: layout.dotSize,
    minutes: selected,
    mode: editTarget,
    onChange: (value) => setMinutes((previous) => ({ ...previous, [editTarget]: value })),
  });

  return (
    <GestureDetector gesture={drag}>
      <View style={styles.root}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill color={COLORS.canvas} />
          <DialArc centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={selected} mode={editTarget} />
          <DialItems centerX={centerX} centerY={centerY} radius={layout.itemRadius} dotSize={layout.dotSize} bonfireDots={layout.bonfireDots} />
          <DialHandle centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={selected} mode={editTarget} />
          <TickNumbers centerX={centerX} centerY={centerY} radius={layout.tickNumberRadius} dotSize={layout.dotSize} />
          <DialReadout centerX={centerX} centerY={centerY} dotSize={layout.dotSize} focusMinutes={minutes.focus} restMinutes={minutes.rest} active={editTarget} />
          <Controls centerX={centerX} centerY={layout.buttonCenterY} dotSize={layout.dotSize} />
        </Canvas>
        <ReadoutButtons centerX={centerX} centerY={centerY} dotSize={layout.dotSize} onSelect={setEditTarget} />
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
});
