import { useSyncExternalStore } from 'react';
import mobileAds, { AdsConsent, MaxAdContentRating } from 'react-native-google-mobile-ads';

let canShowAdvertisement = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const getCanShowAdvertisement = (): boolean => canShowAdvertisement;

/**
 * 광고 동의를 확인하고, 광고를 요청할 수 있으면 광고 SDK를 초기화
 *
 * @returns 초기화 시도가 끝나면 이행하는 프로미스. 실패해도 거부되지 않음
 */
export const initializeAdvertisement = async (): Promise<void> => {
  try {
    await AdsConsent.gatherConsent();
  } catch {
    // 동의 확인에 실패해도 광고 요청 여부는 `getConsentInfo` 결과로 판단
  }

  let canRequestAds: boolean;
  try {
    ({ canRequestAds } = await AdsConsent.getConsentInfo());
  } catch {
    // 동의 정보를 읽지 못하면 동의 여부를 알 수 없어 광고를 요청하지 않음
    return;
  }
  if (!canRequestAds) return;

  try {
    await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.G });
    await mobileAds().initialize();
  } catch {
    // 광고 SDK 초기화에 실패하면 광고 없이 앱을 계속 쓰도록 `canShowAdvertisement`를 false로 남김
    return;
  }

  canShowAdvertisement = true;
  listeners.forEach((listener) => {
    listener();
  });
};

/**
 * 광고 표시 가능 여부 변경 시 리렌더링됨
 *
 * @returns 광고 SDK 초기화가 끝났으면 true
 */
export const useCanShowAdvertisement = (): boolean => useSyncExternalStore(subscribe, getCanShowAdvertisement);
