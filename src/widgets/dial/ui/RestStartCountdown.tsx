import { memo } from 'react';

import { restStartCountdownCenterY } from '../lib/countdown';
import { COLORS } from '@/shared/constants';
import { DotNumber } from '@/shared/ui/dot-number';

type RestStartCountdownProps = {
  centerX: number;
  centerY: number;
  /** 눈금 라벨 중심까지 반지름 (px) */
  numeralRadius: number;
  dotSize: number;
  /** 휴식 시작 전 카운트다운(초). 집중 완료 뒤 5초가 아니면 `null` */
  seconds: number | null;
};

export const RestStartCountdown = memo(({ centerX, centerY, numeralRadius, dotSize, seconds }: RestStartCountdownProps) => {
  if (seconds === null) return null;

  return <DotNumber text={String(seconds)} centerX={centerX} centerY={restStartCountdownCenterY({ centerY, numeralRadius, dotSize })} color={COLORS.rest.text} dotSize={dotSize} />;
});

RestStartCountdown.displayName = 'RestStartCountdown';
