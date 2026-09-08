import { type JSX } from 'react';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { hapticPattern } from '@modules/haptic-pattern';

import { TimerScreen } from '@/screens/timer';

// 진동 지원 여부. 진동을 지원하지 않는 경우 배너로 타이머 완료를 알림
const showsBanner = hapticPattern?.supportsHaptics !== true;

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
