import { type FormFactor } from './responsive';

export const DEVICE_NAMES = ['iPhoneSE', 'iPhone17e', 'iPhoneProMax', 'iPadMini', 'iPadHome', 'iPadPro13', 'androidSmall'] as const;

export type DeviceName = (typeof DEVICE_NAMES)[number];

/** 검산용 실기기 safe area. 짧은 변, 위 끝, 아래 끝 (px), 폼 팩터 */
export const DEVICES: Record<DeviceName, { shortSide: number; topEdge: number; bottomEdge: number; formFactor: FormFactor }> = {
  iPhoneSE: { shortSide: 375, topEdge: 20, bottomEdge: 667, formFactor: 'phone' },
  iPhone17e: { shortSide: 390, topEdge: 47, bottomEdge: 810, formFactor: 'phone' },
  iPhoneProMax: { shortSide: 430, topEdge: 59, bottomEdge: 898, formFactor: 'phone' },
  iPadMini: { shortSide: 744, topEdge: 24, bottomEdge: 1113, formFactor: 'tablet' },
  iPadHome: { shortSide: 768, topEdge: 20, bottomEdge: 1024, formFactor: 'tablet' },
  iPadPro13: { shortSide: 1024, topEdge: 24, bottomEdge: 1346, formFactor: 'tablet' },
  androidSmall: { shortSide: 360, topEdge: 24, bottomEdge: 592, formFactor: 'phone' },
};
