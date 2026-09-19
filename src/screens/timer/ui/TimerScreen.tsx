import { Canvas, Fill } from '@shopify/react-native-skia';
import { useCallback, useMemo, useState, type JSX } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { isNotificationBlocked } from '../lib/notification';

import { useLiveActivity } from '../model/liveActivity';
import { useStoredMinutes } from '../model/minutes';
import { useNotificationSchedule } from '../model/notification';
import { useNotificationPermission } from '../model/permission';
import { useTimerSession } from '../model/session';
import { useTimerSpeed } from '../model/speed';

import { DevPanel } from './DevPanel';
import { NotificationSettingsButton } from './NotificationSettingsButton';
import { SettingsModal } from './SettingsModal';

import { ControlButtons } from '@/widgets/controls';
import {
  colorMode,
  useCompletedEffectStartedAt,
  isThumbTwinkling,
  restDialMinutes,
  DialArc,
  Embers,
  Thumb,
  DialItems,
  DialReadout,
  ReadoutButtons,
  Numerals,
  useDialDrag,
} from '@/widgets/dial';
import { isReadyPhase, type TimerMode } from '@/entities/timer';
import { BUTTON_SIZE_IN_DOTS, COLORS } from '@/shared/constants';
import { resolveLayout } from '@/shared/lib';
import { RoundDotButton } from '@/shared/ui/dot-button';
import { SETTINGS_ICON } from '@/shared/ui/dot-icon';

const SECONDS_IN_MINUTE = 60;

export const TimerScreen = (): JSX.Element => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [editTarget, setEditTarget] = useState<TimerMode>('focus');
  const [settingsShown, setSettingsShown] = useState(false);
  const { minutes, changeMinutes, storeMinutes } = useStoredMinutes();
  const { speed, setSpeed, realSettingMinutes, toSeconds, toMinutes } = useTimerSpeed(minutes);
  const { session, isSettled, remainingSeconds, remainingMinutes, countingMode, play, stop } = useTimerSession({
    settingMinutes: realSettingMinutes,
    toSeconds,
    toMinutes,
  });

  const permission = useNotificationPermission();

  useNotificationSchedule({ session, status: permission, isSettled });
  useLiveActivity({ session, settingMinutes: realSettingMinutes, isSettled });

  const notificationSettingsShown = isNotificationBlocked(permission);

  const layout = resolveLayout({
    shortSide: Math.min(width, height),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
  });

  const centerX = width / 2;
  const centerY = layout.dialCenterY;
  const editing = isReadyPhase(session.phase);
  const shownMode = editing ? editTarget : session.mode;
  const paintedMode = colorMode({ editing, editTarget });
  const selected = minutes[shownMode];

  const resting = !editing && session.mode === 'rest';

  const twinkling = isThumbTwinkling({ isResting: resting, phase: session.phase });

  const effectStartedAt = useCompletedEffectStartedAt(session);
  const effectShown = effectStartedAt !== null;

  // 층별 동작은 `DESIGN.md` §8
  const dialMinutes = useDerivedValue(() => {
    if (editing) return selected;
    if (countingMode.value === 'rest') return restDialMinutes({ focusMinutes: minutes.focus, restMinutes: minutes.rest, remainingMinutes: remainingMinutes.value });

    return remainingMinutes.value;
  });

  const shownMinutes = (remainingSeconds ?? 0) / SECONDS_IN_MINUTE;

  const countedMinutes = resting ? restDialMinutes({ focusMinutes: minutes.focus, restMinutes: minutes.rest, remainingMinutes: shownMinutes }) : shownMinutes;

  // 대기에서 설정 시간을 넘기면 아무 눈금도 붙지 않음
  const litMinutes = editing ? selected : effectShown ? 0 : countedMinutes;

  // 휴식 타이머 시간을 넣으면 집중이 점화한 개체가 꺼짐
  const itemMinutes = resting ? minutes.focus : selected;

  // 대기 상태를 벗어나면 편집 대상이 집중 타이머로 돌아감
  const handlePlay = useCallback(() => {
    setEditTarget('focus');
    play();
  }, [play]);

  const handleChange = useCallback((value: number) => changeMinutes(editTarget, value), [changeMinutes, editTarget]);
  const handleChangeEnd = useCallback((value: number) => storeMinutes(editTarget, value), [storeMinutes, editTarget]);

  const roundButtonTop = insets.top + layout.edgeMargin;
  const notificationSettingsStyle = useMemo(() => [styles.roundButton, { top: roundButtonTop, left: layout.edgeMargin }], [roundButtonTop, layout.edgeMargin]);
  const settingsStyle = useMemo(() => [styles.roundButton, { top: roundButtonTop, right: layout.edgeMargin }], [roundButtonTop, layout.edgeMargin]);
  const controlButtonsTop = layout.buttonCenterY - (BUTTON_SIZE_IN_DOTS * layout.dotSize) / 2;
  const controlButtonsStyle = useMemo(() => [styles.controlButtons, { top: controlButtonsTop }], [controlButtonsTop]);
  const handleSettingsPress = useCallback(() => setSettingsShown(true), []);
  const handleSettingsClose = useCallback(() => setSettingsShown(false), []);

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
            isCompact={layout.isCompact}
            remainingMinutes={litMinutes}
            settingMinutes={itemMinutes}
            isPaused={session.phase === 'paused'}
            isReady={editing}
          />
          <Embers centerX={centerX} centerY={centerY} radius={layout.itemRadius} dotSize={layout.dotSize} effectStartedAt={effectStartedAt} />
          <Thumb centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={dialMinutes} mode={paintedMode} isTwinkling={twinkling} />
          <Numerals centerX={centerX} centerY={centerY} radius={layout.numeralRadius} dotSize={layout.dotSize} />
          <DialReadout
            centerX={centerX}
            centerY={centerY}
            dotSize={layout.dotSize}
            focusMinutes={minutes.focus}
            restMinutes={minutes.rest}
            active={shownMode}
            remainingSeconds={remainingSeconds}
          />
        </Canvas>
        {editing ? <ReadoutButtons centerX={centerX} centerY={centerY} dotSize={layout.dotSize} onSelect={setEditTarget} /> : null}
        <ControlButtons dotSize={layout.dotSize} phase={session.phase} onPlay={handlePlay} onStop={stop} style={controlButtonsStyle} />
        {notificationSettingsShown ? <NotificationSettingsButton dotSize={layout.dotSize} style={notificationSettingsStyle} /> : null}
        <RoundDotButton testID="settings" dotSize={layout.dotSize} icon={SETTINGS_ICON} disabled={!editing} style={settingsStyle} onPress={handleSettingsPress} />
        <SettingsModal visible={settingsShown} dotSize={layout.dotSize} onClose={handleSettingsClose} />
        {__DEV__ ? <DevPanel seconds={remainingSeconds} speed={speed} isSpeedEnabled={editing} onSelectSpeed={setSpeed} /> : null}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.canvas,
  },
  roundButton: {
    position: 'absolute',
  },
  controlButtons: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
