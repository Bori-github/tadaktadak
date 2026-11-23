import { memo, type ComponentType } from 'react';

import { BulbChase } from './BulbChase';
import { Embers } from './Embers';
import { useDisplayedTheme, type ThemeId } from '@/entities/theme';
import { type Palette } from '@/shared/lib';

type CompletedEffectProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  settingMinutes: number;
  effectStartedAt: number | null;
  palette: Palette;
};

const WinterEffect = (props: CompletedEffectProps) => (
  <>
    <BulbChase {...props} />
    <Embers {...props} />
  </>
);

const EFFECTS: Record<ThemeId, ComponentType<CompletedEffectProps>> = {
  campfire: Embers,
  winter: WinterEffect,
};

/** 완료 연출 중 눈금 위 테마 장식. `DESIGN.md` §9 완료 */
export const CompletedEffect = memo((props: CompletedEffectProps) => {
  // `useSyncExternalStore` 기반이라 Skia `Canvas` 내부에서도 조회 가능
  const Effect = EFFECTS[useDisplayedTheme()];

  return <Effect {...props} />;
});

CompletedEffect.displayName = 'CompletedEffect';
