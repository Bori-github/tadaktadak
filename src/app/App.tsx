import { type JSX, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Splash } from './Splash';

import { TimerScreen } from '@/screens/timer';
import { initLocalization, restoreLanguage } from '@/entities/language';
import { canVibrate, prepareVibration, restoreVibrationEnabled, TAP_PATTERN } from '@/entities/vibration';

prepareVibration(TAP_PATTERN);
initLocalization();
restoreLanguage();
restoreVibrationEnabled();

Notifications.setNotificationHandler({
  handleNotification: async () => {
    // 햅틱 미지원 기기나 진동 사용 여부가 꺼진 경우 완료 진동이 없어 포그라운드에서도 완료 배너 표시
    const showsBanner = !canVibrate();

    return {
      shouldShowBanner: showsBanner,
      shouldShowList: showsBanner,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

export const App = (): JSX.Element => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <TimerScreen />
        {isSplashVisible ? <Splash onHidden={() => setIsSplashVisible(false)} /> : null}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
