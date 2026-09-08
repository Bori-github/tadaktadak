import { useEffect, useState } from 'react';

import { completedEffectRemainingMs, completedEffectStartedAt, type TimerSession } from '@/entities/timer';

/**
 * 완료 연출이 시작된 시각 (밀리초). `DESIGN.md` §9 완료
 *
 * @param session - 현재 타이머 세션 값
 * @returns 연출이 진행되는 동안 시작 시각, 끝났거나 없으면 `null`
 */
export const useCompletedEffectStartedAt = (session: TimerSession): number | null => {
  const [startedAt, setStartedAt] = useState<number | null>(null);

  useEffect(() => {
    const start = completedEffectStartedAt(session);
    // 재개해도 시작 시각은 그대로라 지금 시각으로 다시 판정
    const remaining = start === null ? 0 : completedEffectRemainingMs({ startedAt: start, now: Date.now() });

    // 흐른 시간이 아니라 시작 시각을 담아, 완료에서 휴식 타이머 진행으로 넘어가도 받는 쪽이 연출을 다시 시작하지 않음
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStartedAt(remaining === 0 ? null : start);

    if (remaining === 0) return;

    const hiding = setTimeout(() => setStartedAt(null), remaining);

    return () => clearTimeout(hiding);
  }, [session]);

  return startedAt;
};
