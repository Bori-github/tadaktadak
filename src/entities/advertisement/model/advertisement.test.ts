import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import React from 'react';
import type * as ReactNative from 'react-native';

import type * as advertisementModule from './advertisement';

const mockCalls: string[] = [];
let mockCanRequestAds = true;
let mockGatherConsent: () => Promise<unknown>;
let mockInitialize: () => Promise<unknown>;
let mockGetConsentInfo: () => Promise<unknown>;
let mockPrivacyOptionsRequirementStatus = 'NOT_REQUIRED';
let mockShowPrivacyOptionsForm: () => Promise<unknown>;
let mockAppStateListener: ((state: ReactNative.AppStateStatus) => void) | undefined;

const buildConsentInfo = (): Record<string, unknown> => ({
  status: 'NOT_REQUIRED',
  canRequestAds: mockCanRequestAds,
  privacyOptionsRequirementStatus: mockPrivacyOptionsRequirementStatus,
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
    showPrivacyOptionsForm: () => {
      mockCalls.push('showPrivacyOptionsForm');
      return mockShowPrivacyOptionsForm();
    },
  },
  AdsConsentPrivacyOptionsRequirementStatus: { UNKNOWN: 'UNKNOWN', REQUIRED: 'REQUIRED', NOT_REQUIRED: 'NOT_REQUIRED' },
  MaxAdContentRating: { G: 'G', PG: 'PG', T: 'T', MA: 'MA' },
}));

// 모듈 상태(`canShowAdvertisement`, `isPrivacyOptionsRequired`)가 테스트 사이에 남지 않도록 테스트마다 모듈 재로드
const loadAdvertisementModule = (): typeof advertisementModule => {
  let loaded: typeof advertisementModule | undefined;
  jest.isolateModules(() => {
    // 새로 불러온 모듈이 `renderHook`과 다른 React를 쓰면 `Invalid hook call`로 실패해 같은 React를 쓰도록 지정
    jest.doMock('react', () => React);
    // `AppState` 변경 이벤트를 테스트에서 발생시키도록 `AppState.addEventListener` 리스너를 캡처하는 목으로 대체
    const { AppState } = jest.requireActual<typeof ReactNative>('react-native');
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, listener) => {
      mockAppStateListener = listener;
      return {
        remove: () => {
          mockAppStateListener = undefined;
        },
      };
    });
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
  mockPrivacyOptionsRequirementStatus = 'NOT_REQUIRED';
  mockShowPrivacyOptionsForm = async () => buildConsentInfo();
  mockAppStateListener = undefined;
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

  it('광고 SDK 초기화 완료 후 `initializeAdvertisement`를 재호출하면 `gatherConsent`를 호출하지 않는다', async () => {
    const { initializeAdvertisement } = loadAdvertisementModule();

    await initializeAdvertisement();
    mockCalls.length = 0;
    await initializeAdvertisement();

    expect(mockCalls).toEqual([]);
  });

  it('초기화가 끝나기 전에 `initializeAdvertisement`를 재호출해도 `gatherConsent`를 한 번만 호출한다', async () => {
    const { initializeAdvertisement } = loadAdvertisementModule();

    await Promise.all([initializeAdvertisement(), initializeAdvertisement()]);

    expect(mockCalls.filter((call) => call === 'gatherConsent')).toEqual(['gatherConsent']);
  });

  it('`canRequestAds`가 false였으면 `initializeAdvertisement` 재호출 시 `gatherConsent`를 다시 호출한다', async () => {
    mockCanRequestAds = false;
    const { initializeAdvertisement } = loadAdvertisementModule();

    await initializeAdvertisement();
    mockCalls.length = 0;
    await initializeAdvertisement();

    expect(mockCalls).toEqual(['gatherConsent', 'getConsentInfo']);
  });
});

describe('`canStart`가 true가 되면 광고 SDK 초기화를 시작하고, `AppState`가 `active`로 바뀔 때마다 재시도', () => {
  it('`canStart`가 false면 `gatherConsent`를 호출하지 않는다', async () => {
    const { useAdvertisementInitialization } = loadAdvertisementModule();

    await renderHook(() => useAdvertisementInitialization({ canStart: false }));

    expect(mockCalls).toEqual([]);
  });

  it('`canStart`가 true면 `gatherConsent`를 호출한다', async () => {
    const { useAdvertisementInitialization } = loadAdvertisementModule();

    await renderHook(() => useAdvertisementInitialization({ canStart: true }));

    expect(mockCalls).toContain('gatherConsent');
  });

  it('`canRequestAds`가 false였으면 `AppState`가 `active`로 바뀔 때 `gatherConsent`를 다시 호출한다', async () => {
    mockCanRequestAds = false;
    const { useAdvertisementInitialization } = loadAdvertisementModule();
    await renderHook(() => useAdvertisementInitialization({ canStart: true }));
    await act(async () => {});
    mockCalls.length = 0;

    await act(async () => {
      mockAppStateListener?.('active');
    });

    expect(mockCalls).toEqual(['gatherConsent', 'getConsentInfo']);
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

describe('개인정보 옵션 필요 여부 변경 시 리렌더링됨', () => {
  it('`privacyOptionsRequirementStatus`가 `REQUIRED`면 개인정보 옵션이 필요하다', async () => {
    mockPrivacyOptionsRequirementStatus = 'REQUIRED';
    const { initializeAdvertisement, usePrivacyOptionsRequired } = loadAdvertisementModule();
    const { result } = await renderHook(() => usePrivacyOptionsRequired());

    expect(result.current).toBe(false);

    await act(async () => {
      await initializeAdvertisement();
    });

    expect(result.current).toBe(true);
  });

  it('광고를 요청할 수 없어도 `privacyOptionsRequirementStatus`가 `REQUIRED`면 개인정보 옵션이 필요하다', async () => {
    mockCanRequestAds = false;
    mockPrivacyOptionsRequirementStatus = 'REQUIRED';
    const { initializeAdvertisement, usePrivacyOptionsRequired } = loadAdvertisementModule();
    const { result } = await renderHook(() => usePrivacyOptionsRequired());

    await act(async () => {
      await initializeAdvertisement();
    });

    expect(result.current).toBe(true);
  });

  it('`privacyOptionsRequirementStatus`가 `NOT_REQUIRED`면 개인정보 옵션이 필요하지 않다', async () => {
    const { initializeAdvertisement, usePrivacyOptionsRequired } = loadAdvertisementModule();
    const { result } = await renderHook(() => usePrivacyOptionsRequired());

    await act(async () => {
      await initializeAdvertisement();
    });

    expect(result.current).toBe(false);
  });
});

describe('개인정보 옵션 동의 화면 표시', () => {
  it('`showPrivacyOptionsForm`을 호출한다', async () => {
    const { showPrivacyOptions } = loadAdvertisementModule();

    await showPrivacyOptions();

    expect(mockCalls).toEqual(['showPrivacyOptionsForm']);
  });

  it('`showPrivacyOptionsForm`이 실패해도 거부되지 않는다', async () => {
    mockShowPrivacyOptionsForm = async () => {
      throw new Error('동의 화면 표시 실패');
    };
    const { showPrivacyOptions } = loadAdvertisementModule();

    await expect(showPrivacyOptions()).resolves.toBeUndefined();
  });
});
