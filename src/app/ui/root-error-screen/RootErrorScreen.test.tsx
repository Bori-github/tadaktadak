import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Skia } from '@shopify/react-native-skia';
import * as Sentry from '@sentry/react-native';
import { reloadAppAsync } from 'expo';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { RootErrorScreen } from './RootErrorScreen';

import { initLocalization } from '@/entities/language';

jest.mock('expo', () => ({ reloadAppAsync: jest.fn(() => Promise.resolve()) }));

jest.mock('react-native-reanimated', () => ({
  cancelAnimation: () => {},
  Easing: { linear: (value: number) => value },
  useSharedValue: (initial: unknown) => ({ value: initial }),
  withRepeat: (animation: unknown) => animation,
  withTiming: (target: unknown) => target,
}));

// jest.setup.js가 Skia 모듈을 먼저 로드해 jest.mock이 적용되지 않아서 Make만 spyOn으로 대체
const skottieMake = jest.spyOn(Skia.Skottie, 'Make');

const Broken = (): never => {
  throw new Error('render error');
};

beforeAll(() => {
  initLocalization();
});

beforeEach(() => {
  jest.mocked(reloadAppAsync).mockClear();
  skottieMake.mockReturnValue(null as unknown as ReturnType<typeof Skia.Skottie.Make>);
});

describe('에러 화면', () => {
  it('렌더 중 에러가 나면 에러 화면을 표시한다', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    await render(
      <Sentry.ErrorBoundary fallback={<RootErrorScreen />}>
        <Broken />
      </Sentry.ErrorBoundary>,
    );

    expect(screen.getByTestId('root-error-screen')).toBeTruthy();
  });

  it('애니메이션을 만들지 못해도 다시 시작 버튼을 표시한다', async () => {
    await render(<RootErrorScreen />);

    expect(screen.getByRole('button')).toBeTruthy();
  });

  it('다시 시작 버튼을 누르면 앱을 다시 불러온다', async () => {
    await render(<RootErrorScreen />);
    await fireEvent.press(screen.getByRole('button'));

    expect(reloadAppAsync).toHaveBeenCalledTimes(1);
  });
});
