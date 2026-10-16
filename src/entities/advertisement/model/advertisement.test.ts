import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';

import type * as advertisementModule from './advertisement';

const mockCalls: string[] = [];
let mockCanRequestAds = true;
let mockGatherConsent: () => Promise<unknown>;
let mockInitialize: () => Promise<unknown>;
let mockGetConsentInfo: () => Promise<unknown>;

const buildConsentInfo = (): Record<string, unknown> => ({
  status: 'NOT_REQUIRED',
  canRequestAds: mockCanRequestAds,
  privacyOptionsRequirementStatus: 'NOT_REQUIRED',
  isConsentFormAvailable: false,
});

jest.mock('react-native-google-mobile-ads', () => ({
  __esModule: true,
  default: () => ({
    setRequestConfiguration: async (config: { maxAdContentRating?: string }) => {
      mockCalls.push(`setRequestConfiguration:${config.maxAdContentRating}`);
    },
    initialize: () => {
      mockCalls.push('initialize');
      return mockInitialize();
    },
  }),
  AdsConsent: {
    gatherConsent: () => {
      mockCalls.push('gatherConsent');
      return mockGatherConsent();
    },
    getConsentInfo: () => {
      mockCalls.push('getConsentInfo');
      return mockGetConsentInfo();
    },
  },
  MaxAdContentRating: { G: 'G', PG: 'PG', T: 'T', MA: 'MA' },
}));

// `canShowAdvertisement`가 테스트 사이에 남지 않도록 매번 새로 불러옴
const loadAdvertisementModule = (): typeof advertisementModule => {
  let loaded: typeof advertisementModule | undefined;
  jest.isolateModules(() => {
    // 새로 불러온 모듈이 `renderHook`과 다른 React를 쓰면 `Invalid hook call`로 실패해 같은 React를 쓰도록 지정
    jest.doMock('react', () => React);
    loaded = jest.requireActual<typeof advertisementModule>('./advertisement');
  });
  if (loaded === undefined) throw new Error('advertisement 모듈을 불러오지 못함');

  return loaded;
};

beforeEach(() => {
  mockCalls.length = 0;
  mockCanRequestAds = true;
  mockGatherConsent = async () => buildConsentInfo();
  mockInitialize = async () => [];
  mockGetConsentInfo = async () => buildConsentInfo();
});

describe('광고 동의를 확인하고, 광고를 요청할 수 있으면 광고 SDK를 초기화', () => {
  it('동의를 확인한 뒤 동의 정보를 읽고, 최대 광고 콘텐츠 등급을 설정한 뒤 광고 SDK를 초기화한다', async () => {
    const { initializeAdvertisement } = loadAdvertisementModule();

    await initializeAdvertisement();

    expect(mockCalls).toEqual(['gatherConsent', 'getConsentInfo', 'setRequestConfiguration:G', 'initialize']);
  });

  it('광고를 요청할 수 없으면 광고 SDK를 초기화하지 않는다', async () => {
    mockCanRequestAds = false;
    const { initializeAdvertisement } = loadAdvertisementModule();

    await initializeAdvertisement();

    expect(mockCalls).toEqual(['gatherConsent', 'getConsentInfo']);
  });

  it('동의 확인에 실패해도 광고를 요청할 수 있으면 광고 SDK를 초기화한다', async () => {
    mockGatherConsent = async () => {
      throw new Error('동의 확인 실패');
    };
    const { initializeAdvertisement } = loadAdvertisementModule();

    await initializeAdvertisement();

    expect(mockCalls).toEqual(['gatherConsent', 'getConsentInfo', 'setRequestConfiguration:G', 'initialize']);
  });
});

describe('광고 표시 가능 여부 변경 시 리렌더링됨', () => {
  it('광고 SDK 초기화가 끝나면 광고를 표시할 수 있다', async () => {
    const { initializeAdvertisement, useCanShowAdvertisement } = loadAdvertisementModule();
    const { result } = await renderHook(() => useCanShowAdvertisement());

    expect(result.current).toBe(false);

    await act(async () => {
      await initializeAdvertisement();
    });

    expect(result.current).toBe(true);
  });

  it('광고를 요청할 수 없으면 광고를 표시할 수 없다', async () => {
    mockCanRequestAds = false;
    const { initializeAdvertisement, useCanShowAdvertisement } = loadAdvertisementModule();
    const { result } = await renderHook(() => useCanShowAdvertisement());

    await act(async () => {
      await initializeAdvertisement();
    });

    expect(result.current).toBe(false);
  });

  it('광고 SDK 초기화에 실패하면 광고를 표시할 수 없다', async () => {
    mockInitialize = async () => {
      throw new Error('초기화 실패');
    };
    const { initializeAdvertisement, useCanShowAdvertisement } = loadAdvertisementModule();
    const { result } = await renderHook(() => useCanShowAdvertisement());

    await act(async () => {
      await initializeAdvertisement();
    });

    expect(result.current).toBe(false);
  });

  it('동의 정보를 읽지 못하면 광고를 표시할 수 없다', async () => {
    mockGetConsentInfo = async () => {
      throw new Error('동의 정보 읽기 실패');
    };
    const { initializeAdvertisement, useCanShowAdvertisement } = loadAdvertisementModule();
    const { result } = await renderHook(() => useCanShowAdvertisement());

    await act(async () => {
      await initializeAdvertisement();
    });

    expect(result.current).toBe(false);
  });
});
