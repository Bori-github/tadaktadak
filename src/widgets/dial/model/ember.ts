import { useEffect, useState } from 'react';

import { completedEffectRemainingMs, completedEffectStartedAt, COMPLETED_EFFECT_MS, type TimerSession } from '@/entities/timer';

/**
 * 완료 연출이 시작되고 흐른 시간 (밀리초). `DESIGN.md` §9 완료
 *
 * @param session - 현재 타이머 세션 값
 * @returns 연출이 진행되는 동안 흐른 시간, 끝났거나 없으면 `null`
 */
export const useCompletedEffectElapsedMs = (session: TimerSession): number | null => {
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    const startedAt = completedEffectStartedAt(session);
    // 재개해도 시작 시각은 그대로라 지금 시각으로 다시 판정
    const remaining = startedAt === null ? 0 : completedEffectRemainingMs({ startedAt, now: Date.now() });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setElapsedMs(remaining === 0 ? null : COMPLETED_EFFECT_MS - remaining);

    if (remaining === 0) return;

    const hiding = setTimeout(() => setElapsedMs(null), remaining);

    return () => clearTimeout(hiding);
  }, [session]);

  return elapsedMs;
};
