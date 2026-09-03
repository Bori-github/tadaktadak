import { useEffect, useState } from 'react';

import { emberRemainingMs, isEmberShown } from '../lib/ember';

import { type TimerSession } from '@/entities/timer';

/**
 * 불티 노출 여부. `DESIGN.md` §9 완료
 *
 * @param session - 현재 타이머 세션
 * @returns 집중 타이머가 끝나고 불티 수명이 다하기 전이면 `true`
 */
export const useEmberShown = (session: TimerSession): boolean => {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const now = Date.now();

    // 재개해도 시작 시각은 그대로라 지금 시각으로 다시 판정
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShown(isEmberShown({ session, now }));

    const remaining = emberRemainingMs({ session, now });
    if (remaining === null || remaining === 0) return;

    const hiding = setTimeout(() => setShown(false), remaining);

    return () => clearTimeout(hiding);
  }, [session]);

  return shown;
};
