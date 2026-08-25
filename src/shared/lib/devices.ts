export const DEVICE_NAMES = ['iPhoneSE', 'iPhone17e', 'iPhoneProMax', 'iPadMini', 'iPadHome', 'iPadPro13', 'androidSmall'] as const;

export type DeviceName = (typeof DEVICE_NAMES)[number];

/** 검산용 실기기 safe area. 짧은 변, 위 끝, 아래 끝 (px) */
export const DEVICES: Record<DeviceName, { shortSide: number; topEdge: number; bottomEdge: number }> = {
  iPhoneSE: { shortSide: 375, topEdge: 20, bottomEdge: 667 },
  iPhone17e: { shortSide: 390, topEdge: 47, bottomEdge: 810 },
  iPhoneProMax: { shortSide: 430, topEdge: 59, bottomEdge: 898 },
  iPadMini: { shortSide: 744, topEdge: 24, bottomEdge: 1113 },
  iPadHome: { shortSide: 768, topEdge: 20, bottomEdge: 1024 },
  iPadPro13: { shortSide: 1024, topEdge: 24, bottomEdge: 1346 },
  androidSmall: { shortSide: 360, topEdge: 24, bottomEdge: 592 },
};
