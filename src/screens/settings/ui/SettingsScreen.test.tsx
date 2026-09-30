import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { SettingsScreen } from './SettingsScreen';

import { initLocalization } from '@/entities/language';
import { type RootStackParamList } from '@/shared/lib';

// 진동 토글은 이 테스트 대상이 아니고 reanimated가 jest에서 초기화되지 않아서 목으로 대체
jest.mock('@/shared/ui/dot-toggle', () => ({ DotToggle: () => null }));

const Stack = createNativeStackNavigator<RootStackParamList>();

beforeAll(() => {
  initLocalization();
});

describe('SettingsScreen', () => {
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
});
