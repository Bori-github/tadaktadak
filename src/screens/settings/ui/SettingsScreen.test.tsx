import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { StyleSheet } from 'react-native';
import type * as ReactNative from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { SettingsScreen } from './SettingsScreen';

import { initLocalization } from '@/entities/language';
import { type RootStackParamList } from '@/shared/lib';

// 진동 토글은 이 테스트 대상이 아니고 reanimated가 jest에서 초기화되지 않아서 목으로 대체
jest.mock('@/shared/ui/dot-toggle', () => ({ DotToggle: () => null }));

let mockBannerWidth: number | undefined;

// import 시 `TurboModuleRegistry.getEnforcing`이 `RNGoogleMobileAdsModule` 미등록으로 예외를 던져 `width` 캡처용 목으로 대체
jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: ({ width }: { width?: number }) => {
    mockBannerWidth = width;
    return null;
  },
  BannerAdSize: { INLINE_ADAPTIVE_BANNER: 'INLINE_ADAPTIVE_BANNER' },
  TestIds: { ADAPTIVE_BANNER: 'test-adaptive-banner' },
}));

// import 시 react-native-worklets 초기화에서 `loadUnpackers` 미정의 예외가 발생해 reanimated API를 값 반환 목으로 대체
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof ReactNative>('react-native');
  return {
    __esModule: true,
    default: { View },
    cancelAnimation: () => {},
    Easing: { inOut: (easing: unknown) => easing, quad: (value: number) => value },
    useAnimatedStyle: (updater: () => object) => updater(),
    useSharedValue: (initial: unknown) => ({ value: initial }),
    withRepeat: (animation: unknown) => animation,
    withSequence: (...animations: unknown[]) => animations[0],
    withTiming: (target: unknown) => target,
  };
});

// 광고 SDK 초기화 없이 배너를 렌더링하도록 `useCanShowAdvertisement`를 true로 고정한 목으로 대체
jest.mock('@/entities/advertisement', () => ({ useCanShowAdvertisement: () => true, usePrivacyOptionsRequired: () => false }));

const Stack = createNativeStackNavigator<RootStackParamList>();

beforeAll(() => {
  initLocalization();
});

beforeEach(() => {
  mockBannerWidth = undefined;
});

const renderSettingsScreen = async (): Promise<void> => {
  await render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>,
  );
};

describe('설정 화면', () => {
  it('더보기 행을 누르면 더보기 화면을 연다', async () => {
    await render(
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="settings" component={SettingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>,
    );

    await fireEvent.press(screen.getByTestId('settings-more'));

    expect(screen.queryByTestId('more-privacy-policy')).not.toBeNull();
  });

  it('설정 화면 하단에 광고 배너를 렌더링한다', async () => {
    await renderSettingsScreen();

    expect(screen.queryByTestId('advertisement-footer')).not.toBeNull();
  });

  it('광고 배너를 목록 줄 폭으로 요청한다', async () => {
    await renderSettingsScreen();

    const { width: rowWidth } = StyleSheet.flatten(screen.getByTestId('modal-scroll').props.contentContainerStyle);
    expect(mockBannerWidth).toBe(rowWidth);
  });

  it('언어 목록 화면에는 광고 배너를 렌더링하지 않는다', async () => {
    await renderSettingsScreen();

    await fireEvent.press(screen.getByTestId('settings-language'));

    expect(screen.queryByTestId('advertisement-footer')).toBeNull();
  });

  it('더보기 화면에는 광고 배너를 렌더링하지 않는다', async () => {
    await renderSettingsScreen();

    await fireEvent.press(screen.getByTestId('settings-more'));

    expect(screen.queryByTestId('advertisement-footer')).toBeNull();
  });
});
