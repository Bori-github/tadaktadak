import { memo, type ComponentType } from 'react';

import { BulbChase } from './BulbChase';
import { Embers } from './Embers';
import { useDisplayedTheme, type ThemeId } from '@/entities/theme';
import { type BonfireHeightInDots } from '@/shared/constants';
import { type Palette } from '@/shared/lib';

type CompletedEffectProps = {
  centerX: number;
  centerY: number;
  /** 개체 중심 반지름 (px) */
  radius: number;
  dotSize: number;
  bonfireHeightInDots: BonfireHeightInDots;
  settingMinutes: number;
  effectStartedAt: number | null;
  palette: Palette;
};

type EffectProps = CompletedEffectProps & { effectStartedAt: number };

const WinterEffect = (props: EffectProps) => (
  <>
    <BulbChase {...props} />
    <Embers {...props} />
  </>
);

const EFFECTS: Record<ThemeId, ComponentType<EffectProps>> = {
  campfire: Embers,
  winter: WinterEffect,
};

/** 완료 연출 중 눈금 위 테마 장식. `DESIGN.md` §9 완료 */
export const CompletedEffect = memo((props: CompletedEffectProps) => {
  // `useSyncExternalStore` 기반이라 Skia `Canvas` 내부에서도 조회 가능
  const Effect = EFFECTS[useDisplayedTheme()];

  // 완료 연출 중에만 렌더링. 드래그 중 설정 시간 변경에 따른 리렌더링 방지
  const { effectStartedAt } = props;
  if (effectStartedAt === null) return null;

  return <Effect {...props} effectStartedAt={effectStartedAt} />;
});

CompletedEffect.displayName = 'CompletedEffect';
