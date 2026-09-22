import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Skia } from '@shopify/react-native-skia';
import { render, screen } from '@testing-library/react-native';
import type * as ReactNative from 'react-native';
import BootSplash from 'react-native-bootsplash';

import { Splash } from './Splash';

const mockSetActive = jest.fn();

// withDelay·withTiming을 즉시 완료로 대체해 완료 콜백을 동기 호출
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual<typeof ReactNative>('react-native');

  return {
    __esModule: true,
    default: { View },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: (compute: () => unknown) => compute(),
    useFrameCallback: () => ({ setActive: mockSetActive }),
    withDelay: (_delay: number, animation: unknown) => animation,
    withTiming: (target: unknown, _config: unknown, callback?: () => void) => {
      callback?.();
      return target;
    },
  };
});

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: () => void) => {
    callback();
  },
}));

const useHideAnimation = jest.mocked(BootSplash.useHideAnimation);
// jest.setup.js가 Skia 모듈을 먼저 로드해 jest.mock이 적용되지 않아서 Make만 spyOn으로 대체
const skottieMake = jest.spyOn(Skia.Skottie, 'Make');

/**
 * Splash를 렌더하고 useHideAnimation에 전달된 animate를 꺼냄
 *
 * @returns onHidden 목과 animate 호출 함수
 */
const renderSplash = async (): Promise<{ onHidden: jest.Mock; animate: () => void }> => {
  let animate = (): void => {};
  useHideAnimation.mockImplementation((config) => {
    animate = config.animate;
    return { container: { style: {}, onLayout: () => {} }, logo: { source: 0 }, brand: { source: 0 } };
  });
  const onHidden = jest.fn();
  await render(<Splash onHidden={onHidden} />);

  return { onHidden, animate: () => animate() };
};

beforeEach(() => {
  mockSetActive.mockReset();
  // jest의 Make는 웹 구현이라 호출 시 예외 발생. 네이티브 파싱 실패와 같은 null 반환으로 고정
  // 반환 타입에 null이 없어서 단언
  skottieMake.mockReturnValue(null as unknown as ReturnType<typeof Skia.Skottie.Make>);
});

describe('스플래시', () => {
  it('페이드아웃이 끝나면 onHidden을 호출한다', async () => {
    const { onHidden, animate } = await renderSplash();

    animate();

    expect(onHidden).toHaveBeenCalledTimes(1);
  });

  it('animate에서 예외가 나면 바로 onHidden을 호출한다', async () => {
    mockSetActive.mockImplementation(() => {
      throw new Error('setActive 실패');
    });
    const { onHidden, animate } = await renderSplash();

    animate();

    expect(onHidden).toHaveBeenCalledTimes(1);
  });

  it('Lottie를 만들지 못하면 캔버스 없이 렌더한다', async () => {
    await renderSplash();

    // Canvas가 없으면 자식은 로고 Image 하나
    expect(screen.getByTestId('splash').children).toHaveLength(1);
  });
});
