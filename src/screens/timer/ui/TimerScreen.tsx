import { Canvas, Fill } from '@shopify/react-native-skia';
import { useState, type JSX } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStoredMinutes } from '../model/minutes';
import { useTimerSession } from '../model/session';
import { useTimerSpeed } from '../model/speed';

import { SpeedControl } from './SpeedControl';

import { ControlButtons, Controls, type ControlButton } from '@/widgets/controls';
import { DialArc, DialHandle, DialItems, DialReadout, ReadoutButtons, TickNumbers, useDialDrag } from '@/widgets/dial';
import { type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';
import { resolveLayout } from '@/shared/lib';

export const TimerScreen = (): JSX.Element => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [editTarget, setEditTarget] = useState<TimerMode>('focus');
  const { minutes, changeMinutes } = useStoredMinutes();
  const [pressed, setPressed] = useState<ControlButton | null>(null);
  const { speed, setSpeed, realSettingMinutes, toSeconds } = useTimerSpeed(minutes);
  const { session, remainingSeconds, play, stop } = useTimerSession({ settingMinutes: realSettingMinutes, toSeconds });

  const layout = resolveLayout({
    shortSide: Math.min(width, height),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
  });

  const centerX = width / 2;
  const centerY = layout.dialCenterY;
  const editing = session.phase === 'idle';
  const shownMode = editing ? editTarget : session.mode;
  const selected = minutes[shownMode];

  const drag = useDialDrag({
    centerX,
    centerY,
    radius: layout.arcRadius,
    dotSize: layout.dotSize,
    minutes: minutes[editTarget],
    mode: editTarget,
    enabled: editing,
    onChange: (value) => changeMinutes(editTarget, value),
  });

  return (
    <GestureDetector gesture={drag}>
      <View style={styles.root}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill color={COLORS.canvas} />
          <DialArc centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={selected} mode={shownMode} />
          <DialItems centerX={centerX} centerY={centerY} radius={layout.itemRadius} dotSize={layout.dotSize} bonfireDots={layout.bonfireDots} />
          <DialHandle centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={selected} mode={shownMode} />
          <TickNumbers centerX={centerX} centerY={centerY} radius={layout.tickNumberRadius} dotSize={layout.dotSize} />
          <DialReadout
            centerX={centerX}
            centerY={centerY}
            dotSize={layout.dotSize}
            focusMinutes={minutes.focus}
            restMinutes={minutes.rest}
            active={shownMode}
            remainingSeconds={editing ? null : remainingSeconds}
          />
          <Controls centerX={centerX} centerY={layout.buttonCenterY} dotSize={layout.dotSize} phase={session.phase} pressed={pressed} />
        </Canvas>
        <ReadoutButtons centerX={centerX} centerY={centerY} dotSize={layout.dotSize} onSelect={setEditTarget} />
        <ControlButtons centerX={centerX} centerY={layout.buttonCenterY} dotSize={layout.dotSize} phase={session.phase} onPlay={play} onStop={stop} onPressedChange={setPressed} />
        {__DEV__ ? <SpeedControl speed={speed} enabled={editing} onSelect={setSpeed} /> : null}
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
