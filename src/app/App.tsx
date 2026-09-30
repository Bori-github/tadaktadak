import { type JSX, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Splash } from './Splash';

import { completionNotificationBehavior, TimerScreen } from '@/screens/timer';
import { initLocalization, restoreLanguage } from '@/entities/language';
import { canVibrate, prepareVibration, restoreVibrationEnabled, TAP_PATTERN } from '@/entities/vibration';
import { type RootStackParamList } from '@/shared/lib';

prepareVibration(TAP_PATTERN);
initLocalization();
restoreLanguage();
restoreVibrationEnabled();

Notifications.setNotificationHandler({
  handleNotification: async () => completionNotificationBehavior({ canVibrate: canVibrate(), platform: Platform.OS }),
});

const Stack = createNativeStackNavigator<RootStackParamList>();

export const App = (): JSX.Element => {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="timer" component={TimerScreen} />
          </Stack.Navigator>
        </NavigationContainer>
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
