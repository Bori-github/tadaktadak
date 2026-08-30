import { Canvas, Fill } from '@shopify/react-native-skia';
import { useCallback, useState, type JSX } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStoredMinutes } from '../model/minutes';
import { useTimerSession } from '../model/session';
import { useTimerSpeed } from '../model/speed';

import { SpeedControl } from './SpeedControl';

import { ControlButtons, Controls, type ControlButton } from '@/widgets/controls';
import { colorMode, DialArc, Thumb, DialItems, DialReadout, ReadoutButtons, Numerals, useDialDrag } from '@/widgets/dial';
import { type TimerMode } from '@/entities/timer';
import { COLORS } from '@/shared/constants';
import { resolveLayout } from '@/shared/lib';

const SECONDS_IN_MINUTE = 60;

export const TimerScreen = (): JSX.Element => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [editTarget, setEditTarget] = useState<TimerMode>('focus');
  const { minutes, changeMinutes, storeMinutes } = useStoredMinutes();
  const [pressed, setPressed] = useState<ControlButton | null>(null);
  const { speed, setSpeed, realSettingMinutes, toSeconds, toMinutes } = useTimerSpeed(minutes);
  const { session, remainingSeconds, remainingMinutes, play, stop } = useTimerSession({ settingMinutes: realSettingMinutes, toSeconds, toMinutes });

  const layout = resolveLayout({
    shortSide: Math.min(width, height),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
  });

  const centerX = width / 2;
  const centerY = layout.dialCenterY;
  const editing = session.phase === 'ready';
  const shownMode = editing ? editTarget : session.mode;
  const paintedMode = colorMode({ editing, editTarget });
  const selected = minutes[shownMode];

  // 층별 동작은 `DESIGN.md` §8
  const dialMinutes = useDerivedValue(() => (editing ? selected : remainingMinutes.value));

  // 대기에서 설정 시간을 넘기면 아무 눈금도 붙지 않음
  const litMinutes = editing ? selected : (remainingSeconds ?? 0) / SECONDS_IN_MINUTE;

  const handleChange = useCallback((value: number) => changeMinutes(editTarget, value), [changeMinutes, editTarget]);
  const handleChangeEnd = useCallback((value: number) => storeMinutes(editTarget, value), [storeMinutes, editTarget]);

  const drag = useDialDrag({
    centerX,
    centerY,
    radius: layout.arcRadius,
    dotSize: layout.dotSize,
    minutes: minutes[editTarget],
    mode: editTarget,
    enabled: editing,
    onChange: handleChange,
    onChangeEnd: handleChangeEnd,
  });

  return (
    <GestureDetector gesture={drag}>
      <View style={styles.root}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill color={COLORS.canvas} />
          <DialArc centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={dialMinutes} mode={paintedMode} />
          <DialItems
            centerX={centerX}
            centerY={centerY}
            radius={layout.itemRadius}
            dotSize={layout.dotSize}
            bonfireDots={layout.bonfireDots}
            remainingMinutes={litMinutes}
            settingMinutes={selected}
            isPaused={session.phase === 'paused'}
          />
          <Thumb centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={dialMinutes} mode={paintedMode} />
          <Numerals centerX={centerX} centerY={centerY} radius={layout.numeralRadius} dotSize={layout.dotSize} />
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
