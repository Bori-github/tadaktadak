import { Canvas, Fill } from '@shopify/react-native-skia';
import { useCallback, useEffect, useMemo, useState, type JSX } from 'react';
import { Linking, StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';

import { isNotificationBlocked } from '../lib/notification';

import { useLiveActivity } from '../model/liveActivity';
import { useStoredMinutes } from '../model/minutes';
import { useNotificationSchedule } from '../model/notification';
import { useNotificationPermission } from '../model/permission';
import { useTimerSession } from '../model/session';
import { useTimerSpeed } from '../model/speed';

import { DevPanel } from './DevPanel';

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
import { playVibration } from '@/entities/vibration';
import { BUTTON_SIZE_IN_DOTS, COLORS } from '@/shared/constants';
import { isTabletWindow, resolveLayout, type RootStackParamList } from '@/shared/lib';
import { RoundDotButton } from '@/shared/ui/dot-button';
import { NOTIFICATION_OFF_ICON, SETTINGS_ICON } from '@/shared/ui/dot-icon';

const SECONDS_IN_MINUTE = 60;

type TimerScreenProps = NativeStackScreenProps<RootStackParamList, 'timer'>;

export const TimerScreen = ({ navigation }: TimerScreenProps): JSX.Element => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [editTarget, setEditTarget] = useState<TimerMode>('focus');
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
    isTablet: isTabletWindow(Math.min(width, height)),
    safeAreaTopEdge: insets.top,
    safeAreaBottomEdge: height - insets.bottom,
    safeAreaLeftEdge: insets.left,
    safeAreaRightEdge: width - insets.right,
  });

  const centerX = layout.dialCenterX;
  const centerY = layout.dialCenterY;
  const editing = isReadyPhase(session.phase);
  const shownMode = editing ? editTarget : session.mode;
  const paintedMode = colorMode({ editing, editTarget });
  const selected = minutes[shownMode];

  // 앱 재실행 때 세션 복원 전에 연 설정 화면이 진행 중에도 남아서 대기 상태를 벗어나면 여기서 닫음
  useEffect(() => {
    if (!editing && !isFocused) navigation.goBack();
  }, [editing, isFocused, navigation]);

  const resting = !editing && session.mode === 'rest';

  const twinkling = isThumbTwinkling({ isResting: resting, phase: session.phase });

  const effectStartedAt = useCompletedEffectStartedAt(session);
  const effectShown = effectStartedAt !== null;

  const shownMinutes = (remainingSeconds ?? 0) / SECONDS_IN_MINUTE;

  const countedMinutes = resting ? restDialMinutes({ focusMinutes: minutes.focus, restMinutes: minutes.rest, remainingMinutes: shownMinutes }) : shownMinutes;

  const sessionLitMinutes = effectShown ? 0 : countedMinutes;

  // 대기에서 설정 시간을 넘기면 아무 눈금도 붙지 않음
  const litMinutes = editing ? selected : sessionLitMinutes;

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
  const roundButtonLeft = insets.left + layout.edgeMargin;
  const roundButtonRight = insets.right + layout.edgeMargin;
  const notificationSettingsStyle = useMemo(() => [styles.roundButton, { top: roundButtonTop, left: roundButtonLeft }], [roundButtonTop, roundButtonLeft]);
  const settingsStyle = useMemo(() => [styles.roundButton, { top: roundButtonTop, right: roundButtonRight }], [roundButtonTop, roundButtonRight]);
  const controlButtonsTop = layout.buttonCenterY - (BUTTON_SIZE_IN_DOTS * layout.dotSize) / 2;
  const controlButtonsShift = layout.buttonsCenterX - width / 2;
  const controlButtonsStyle = useMemo(
    () => [styles.controlButtons, { top: controlButtonsTop, transform: [{ translateX: controlButtonsShift }] }],
    [controlButtonsTop, controlButtonsShift],
  );
  const handleSettingsPress = useCallback(() => navigation.navigate('settings'), [navigation]);
  // 설정 앱 열기 실패 시 화면 변화 없음
  const handleNotificationSettingsPress = useCallback(() => Linking.openSettings().catch(() => {}), []);

  const { gesture, draggedMinutes, isShowingDragged } = useDialDrag({
    centerX,
    centerY,
    radius: layout.arcRadius,
    dotSize: layout.dotSize,
    minutes: minutes[editTarget],
    mode: editTarget,
    enabled: editing && isFocused,
    onChange: handleChange,
    onChangeEnd: handleChangeEnd,
  });

  const dialMinutes = useDerivedValue(() => {
    if (editing) return isShowingDragged.value ? draggedMinutes.value : selected;
    if (countingMode.value === 'rest') return restDialMinutes({ focusMinutes: minutes.focus, restMinutes: minutes.rest, remainingMinutes: remainingMinutes.value });

    return remainingMinutes.value;
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.root}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Fill color={COLORS.canvas} />
          <DialArc centerX={centerX} centerY={centerY} radius={layout.arcRadius} dotSize={layout.dotSize} minutes={dialMinutes} mode={paintedMode} />
          <DialItems
            centerX={centerX}
            centerY={centerY}
            radius={layout.itemRadius}
            dotSize={layout.dotSize}
            bonfireHeightInDots={layout.bonfireHeightInDots}
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
        {notificationSettingsShown ? (
          <RoundDotButton
            testID="notification-settings"
            dotSize={layout.dotSize}
            icon={NOTIFICATION_OFF_ICON}
            style={notificationSettingsStyle}
            onPress={handleNotificationSettingsPress}
            onPressIn={() => playVibration()}
          />
        ) : null}
        <RoundDotButton
          testID="settings"
          dotSize={layout.dotSize}
          icon={SETTINGS_ICON}
          disabled={!editing}
          style={settingsStyle}
          onPress={handleSettingsPress}
          onPressIn={() => playVibration()}
        />
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
