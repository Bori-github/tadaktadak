import { useEffect, useState } from 'react';

import { emberRemainingMs } from '../lib/ember';

import { COMPLETED_EFFECT_MS, type TimerSession } from '@/entities/timer';

/**
 * 불티가 튀어 오르기 시작하고 흐른 시간 (밀리초). `DESIGN.md` §9 완료
 *
 * @param session - 현재 타이머 세션
 * @returns 노출 중이면 흐른 시간, 아니면 `null`
 */
export const useEmberElapsedMs = (session: TimerSession): number | null => {
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    // 잴 수 없는 단계와 수명이 다한 자리를 같이 다루려고 `null`을 0으로 받음
    const remaining = emberRemainingMs({ session, now: Date.now() }) ?? 0;

    // 재개해도 시작 시각은 그대로라 지금 시각으로 다시 판정
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElapsedMs(remaining === 0 ? null : COMPLETED_EFFECT_MS - remaining);

    if (remaining === 0) return;

    const hiding = setTimeout(() => setElapsedMs(null), remaining);

    return () => clearTimeout(hiding);
  }, [session]);

  return elapsedMs;
};
