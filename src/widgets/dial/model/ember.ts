import { useEffect, useState } from 'react';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';

import { completedEffectRemainingMs, completedEffectStartedAt, type TimerSession } from '@/entities/timer';

/** 시작 시각 미설정 값. 첫 프레임에서 기기 가동 시간으로 설정 */
const NOT_STARTED = -1;

/**
 * 완료 연출 시작 후 경과 시간 (밀리초). 프레임마다 갱신
 *
 * @param effectStartedAt - 완료 연출 시작 시각 (밀리초). `null`이면 갱신 정지
 * @returns 경과 시간 공유 값. 백그라운드 경과 시간 포함
 */
export const useCompletedEffectElapsed = (effectStartedAt: number | null): SharedValue<number> => {
  const elapsed = useSharedValue(0);
  const frameStartedAt = useSharedValue(NOT_STARTED);

  const clock = useFrameCallback((frame) => {
    'worklet';
    if (frameStartedAt.value === NOT_STARTED) frameStartedAt.value = frame.timestamp - elapsed.value;

    elapsed.value = frame.timestamp - frameStartedAt.value;
  }, false);

  useEffect(() => {
    // 백그라운드 경과 시간 반영을 위해 첫 프레임 전 초기화
    frameStartedAt.set(NOT_STARTED);
    elapsed.set(effectStartedAt === null ? 0 : Date.now() - effectStartedAt);
    clock.setActive(effectStartedAt !== null);
  }, [clock, effectStartedAt, elapsed, frameStartedAt]);

  return elapsed;
};

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
