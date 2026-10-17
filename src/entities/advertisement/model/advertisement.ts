import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import mobileAds, { AdsConsent, type AdsConsentInfo, AdsConsentPrivacyOptionsRequirementStatus, MaxAdContentRating } from 'react-native-google-mobile-ads';

let canShowAdvertisement = false;
let isPrivacyOptionsRequired = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getCanShowAdvertisement = (): boolean => canShowAdvertisement;

const getIsPrivacyOptionsRequired = (): boolean => isPrivacyOptionsRequired;

const notifyListeners = (): void => {
  listeners.forEach((listener) => {
    listener();
  });
};

let pendingInitialization: Promise<void> | undefined;

const runInitialization = async (): Promise<void> => {
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // 동의 확인에 실패해도 광고 요청 여부는 `getConsentInfo` 결과로 판단
  }

  let consentInfo: AdsConsentInfo;
  try {
    consentInfo = await AdsConsent.getConsentInfo();
  } catch {
    // 동의 정보를 읽지 못하면 동의 여부를 알 수 없어 광고를 요청하지 않음
    return;
  }

  isPrivacyOptionsRequired = consentInfo.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  notifyListeners();
  if (!consentInfo.canRequestAds) return;

  try {
    await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.G });
    await mobileAds().initialize();
  } catch {
    // 광고 SDK 초기화에 실패하면 광고 없이 앱을 계속 쓰도록 `canShowAdvertisement`를 false로 남김
    return;
  }

  canShowAdvertisement = true;
  notifyListeners();
};

/**
 * 광고 동의를 확인하고, 광고를 요청할 수 있으면 광고 SDK를 초기화. 완료 후 재실행하지 않고, 끝나지 않은 초기화가 있으면 그 프로미스 반환
 *
 * @returns 초기화 시도가 끝나면 이행하는 프로미스. 실패해도 거부되지 않음
 */
export const initializeAdvertisement = (): Promise<void> => {
  if (canShowAdvertisement) return Promise.resolve();

  pendingInitialization ??= runInitialization().finally(() => {
    pendingInitialization = undefined;
  });
  return pendingInitialization;
};

type AdvertisementInitializationOptions = {
  canStart: boolean;
};

/**
 * `canStart`가 true가 되면 광고 SDK 초기화를 시작하고, `AppState`가 `active`로 바뀔 때마다 재시도
 *
 * @param options.canStart - false인 동안 초기화하지 않음
 * @returns 없음
 */
export const useAdvertisementInitialization = ({ canStart }: AdvertisementInitializationOptions): void => {
  useEffect(() => {
    if (!canStart) return;

    initializeAdvertisement();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') initializeAdvertisement();
    });
    return () => {
      subscription.remove();
    };
  }, [canStart]);
};

/**
 * 광고 표시 가능 여부 변경 시 리렌더링됨
 *
 * @returns 광고 SDK 초기화가 끝났으면 true
 */
export const useCanShowAdvertisement = (): boolean => useSyncExternalStore(subscribe, getCanShowAdvertisement);

/**
 * 개인정보 옵션 필요 여부 변경 시 리렌더링됨
 *
 * @returns 동의 정보의 `privacyOptionsRequirementStatus`가 `REQUIRED`면 true
 */
export const usePrivacyOptionsRequired = (): boolean => useSyncExternalStore(subscribe, getIsPrivacyOptionsRequired);

/**
 * 개인정보 옵션 동의 화면 표시
 *
 * @returns 동의 화면이 닫히면 이행하는 프로미스. 실패해도 거부되지 않음
 */
export const showPrivacyOptions = async (): Promise<void> => {
  try {
    await AdsConsent.showPrivacyOptionsForm();
  } catch {
    // 동의 화면 표시 실패 시 더보기 화면 유지, 재시도는 행 터치로 처리
  }
};
