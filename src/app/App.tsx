import { type JSX } from 'react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TimerScreen } from '@/screens/timer';
import { initLocalization, restoreLanguage } from '@/entities/language';
import { canVibrate, prepareVibration, TAP_PATTERN } from '@/entities/vibration';

// 햅틱 미지원 기기는 완료 진동이 없어 포그라운드에서도 완료 배너 표시
const showsBanner = !canVibrate();

prepareVibration(TAP_PATTERN);
initLocalization();
restoreLanguage();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: showsBanner,
    shouldShowList: showsBanner,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const App = (): JSX.Element => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <TimerScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
