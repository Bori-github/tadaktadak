import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react-native';

import { AdvertisementFooter } from './AdvertisementFooter';

type BannerProps = {
  unitId: string;
  size: string;
  width?: number;
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
  BannerAdSize: { LARGE_ANCHORED_ADAPTIVE_BANNER: 'LARGE_ANCHORED_ADAPTIVE_BANNER' },
  TestIds: { ADAPTIVE_BANNER: 'test-adaptive-banner' },
}));

// `useCanShowAdvertisement` 반환값을 테스트별로 제어하도록 목으로 대체
jest.mock('@/entities/advertisement', () => ({
  useCanShowAdvertisement: () => mockCanShowAdvertisement,
}));

beforeEach(() => {
  mockBannerProps = undefined;
  mockCanShowAdvertisement = true;
});

describe('설정 화면 하단 구분선과 광고 배너', () => {
  it('광고 표시 가능 시 `width` 폭의 `LARGE_ANCHORED_ADAPTIVE_BANNER`를 요청한다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    expect(mockBannerProps).toEqual(expect.objectContaining({ unitId: 'test-adaptive-banner', size: 'LARGE_ANCHORED_ADAPTIVE_BANNER', width: 342 }));
  });

  it('광고 로드 완료 전 배너 영역에 최소 높이를 지정한다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    expect(screen.getByTestId('advertisement-banner-area')).toHaveStyle({ minHeight: 50 });
  });

  it('`onAdFailedToLoad` 발생 시 구분선과 배너를 렌더링하지 않는다', async () => {
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    await act(() => {
      mockBannerProps?.onAdFailedToLoad?.(new Error('광고 없음'));
    });

    expect(screen.queryByTestId('advertisement-footer')).toBeNull();
  });

  it('`useCanShowAdvertisement`가 false면 구분선과 배너를 렌더링하지 않는다', async () => {
    mockCanShowAdvertisement = false;
    await render(<AdvertisementFooter dotSize={2} width={342} />);

    expect(screen.queryByTestId('advertisement-footer')).toBeNull();
  });
});
