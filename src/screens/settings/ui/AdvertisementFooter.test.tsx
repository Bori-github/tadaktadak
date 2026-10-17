import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type * as ReactNative from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import React from 'react';

import { AdvertisementFooter } from './AdvertisementFooter';

type BannerProps = {
  unitId: string;
  size: string;
  width?: number;
  maxHeight?: number;
  onAdLoaded?: () => void;
  onAdFailedToLoad?: (error: Error) => void;
};

let mockBannerProps: BannerProps | undefined;
let mockCanShowAdvertisement = true;

// import 시 `TurboModuleRegistry.getEnforcing`이 `RNGoogleMobileAdsModule` 미등록으로 예외를 던져 prop 캡처용 목으로 대체
jest.mock('react-native-google-mobile-ads', () => ({
  BannerAd: (props: BannerProps) => {
    mockBannerProps = props;
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

// `useCanShowAdvertisement` 반환값을 테스트별로 제어하도록 목으로 대체
jest.mock('@/entities/advertisement', () => ({
  useCanShowAdvertisement: () => mockCanShowAdvertisement,
}));

beforeEach(() => {
  mockBannerProps = undefined;
  mockCanShowAdvertisement = true;
});

describe('설정 화면 하단 구분선과 광고 배너', () => {
  it('광고 표시 가능 시 `width` 폭과 `maxHeight` 높이 상한으로 `INLINE_ADAPTIVE_BANNER`를 요청한다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    expect(mockBannerProps).toEqual(expect.objectContaining({ unitId: 'test-adaptive-banner', size: 'INLINE_ADAPTIVE_BANNER', width: 342, maxHeight: 40 }));
  });

  it('광고 로드 완료 전 배너 영역에 `maxHeight`와 같은 최소 높이를 지정한다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    expect(screen.getByTestId('advertisement-banner-area')).toHaveStyle({ minHeight: 40 });
  });

  it('광고 로드 전 배너 영역에 스켈레톤을 렌더링한다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    expect(screen.queryByTestId('advertisement-skeleton')).not.toBeNull();
  });

  it('`onAdLoaded` 발생 시 스켈레톤을 언마운트한다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    await act(() => {
      mockBannerProps?.onAdLoaded?.();
    });

    expect(screen.queryByTestId('advertisement-skeleton')).toBeNull();
  });

  it('광고 로드 전 `onAdFailedToLoad` 발생 시 구분선과 배너를 렌더링하지 않는다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    await act(() => {
      mockBannerProps?.onAdFailedToLoad?.(new Error('광고 없음'));
    });

    expect(screen.queryByTestId('advertisement-footer')).toBeNull();
  });

  it('`onAdLoaded` 이후 자동 새로고침에서 `onAdFailedToLoad` 발생 시 구분선과 배너를 유지한다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    await act(() => {
      mockBannerProps?.onAdLoaded?.();
    });
    await act(() => {
      mockBannerProps?.onAdFailedToLoad?.(new Error('광고 없음'));
    });

    expect(screen.queryByTestId('advertisement-footer')).not.toBeNull();
  });

  it('`__DEV__`가 false이고 광고 단위 ID 환경 변수가 없으면 구분선과 배너를 렌더링하지 않는다', async () => {
    const originalIsDev = __DEV__;
    let IsolatedAdvertisementFooter: typeof AdvertisementFooter | undefined;
    jest.isolateModules(() => {
      // `BANNER_UNIT_ID`가 모듈 로드 시 결정되어 `__DEV__`와 `ENV` 변경 후 모듈 재로드
      Object.assign(globalThis, { __DEV__: false });
      // 새로 불러온 모듈이 `render`와 다른 React를 쓰면 `Invalid hook call`로 실패해 같은 React를 쓰도록 지정
      jest.doMock('react', () => React);
      jest.doMock('@/shared/constants', () => ({
        ...jest.requireActual<object>('@/shared/constants'),
        ENV: { ADMOB_IOS_BANNER_UNIT_ID: undefined, ADMOB_ANDROID_BANNER_UNIT_ID: undefined },
      }));
      IsolatedAdvertisementFooter = jest.requireActual<{ AdvertisementFooter: typeof AdvertisementFooter }>('./AdvertisementFooter').AdvertisementFooter;
    });
    Object.assign(globalThis, { __DEV__: originalIsDev });
    if (IsolatedAdvertisementFooter === undefined) throw new Error('AdvertisementFooter 모듈을 불러오지 못함');

    await render(<IsolatedAdvertisementFooter dotSize={2} width={342} />);

    expect(screen.queryByTestId('advertisement-footer')).toBeNull();
  });

  it('`useCanShowAdvertisement`가 false면 구분선과 배너를 렌더링하지 않는다', async () => {
    mockCanShowAdvertisement = false;
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    expect(screen.queryByTestId('advertisement-footer')).toBeNull();
  });
});
