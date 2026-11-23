import { memo, type ComponentType } from 'react';

import { Wire } from './Wire';
import { Wreath } from './Wreath';
import { useDisplayedTheme, type ThemeId } from '@/entities/theme';

type DialUnderlayProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  settingMinutes: number;
};

const WinterUnderlay = ({ centerX, centerY, radius, dotSize, settingMinutes }: DialUnderlayProps) => (
  <>
    <Wreath centerX={centerX} centerY={centerY} radius={radius} dotSize={dotSize} />
    <Wire centerX={centerX} centerY={centerY} radius={radius} dotSize={dotSize} settingMinutes={settingMinutes} />
  </>
);

const UNDERLAYS: Record<ThemeId, ComponentType<DialUnderlayProps> | null> = {
  campfire: null,
  winter: WinterUnderlay,
};

/** 호와 눈금 아래 테마 장식 */
export const DialUnderlay = memo((props: DialUnderlayProps) => {
  // `useSyncExternalStore` 기반이라 Skia `Canvas` 내부에서도 조회 가능
  const Underlay = UNDERLAYS[useDisplayedTheme()];

  return Underlay ? <Underlay {...props} /> : null;
});

DialUnderlay.displayName = 'DialUnderlay';
