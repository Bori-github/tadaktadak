import { type JSX, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootErrorScreen } from './ui/root-error-screen/RootErrorScreen';
import { Splash } from './ui/splash/Splash';

import { SettingsScreen } from '@/screens/settings';
import { completionNotificationBehavior, TimerScreen } from '@/screens/timer';
import { restoreAmbientSoundEnabled, useAmbientSoundPlayback } from '@/entities/ambient-sound';
import { initLocalization, restoreLanguage } from '@/entities/language';
import { canVibrate, prepareVibration, restoreVibrationEnabled, TAP_PATTERN } from '@/entities/vibration';
import { COLORS } from '@/shared/constants';
import { type RootStackParamList } from '@/shared/lib';

prepareVibration(TAP_PATTERN);
initLocalization();
restoreLanguage();
restoreVibrationEnabled();
restoreAmbientSoundEnabled();

Notifications.setNotificationHandler({
  handleNotification: async () => completionNotificationBehavior({ canVibrate: canVibrate(), platform: Platform.OS }),
});

const Stack = createNativeStackNavigator<RootStackParamList>();

export const App = (): JSX.Element => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [hasError, setHasError] = useState(false);

  useAmbientSoundPlayback({ canPlay: !isSplashVisible && !hasError });

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Sentry.ErrorBoundary fallback={<RootErrorScreen />} onError={() => setHasError(true)}>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.canvas } }}>
              <Stack.Screen name="timer" component={TimerScreen} />
              <Stack.Screen name="settings" component={SettingsScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
            </Stack.Navigator>
          </NavigationContainer>
        </Sentry.ErrorBoundary>
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
