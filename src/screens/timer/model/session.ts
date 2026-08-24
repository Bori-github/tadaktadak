import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { millisecondsToSeconds } from '../lib/seconds';

import { completeTimer, IDLE_SESSION, MINUTE_IN_MS, pauseTimer, remainingMs, restoreSession, resumeTimer, startTimer, type TimerMode, type TimerSession } from '@/entities/timer';

/** 기기 가동 시간을 첫 프레임에서 채우기 전 값 */
const NOT_STARTED = -1;

type TimerSessionInput = {
  settingMinutes: Record<TimerMode, number>;
};

/**
 * 타이머 세션 값과 카운트다운. `SPEC.md` 시간 모델
 *
 * @param input.settingMinutes - 집중과 휴식의 설정 시간(분)
 * @returns 지금 타이머 세션 값, 카운트다운 중인 남은 시간(초, 대기에서는 `null`), 재생·정지 조작
 */
export const useTimerSession = ({ settingMinutes }: TimerSessionInput) => {
  const [session, setSession] = useState<TimerSession>(IDLE_SESSION);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const remainingAtStart = useSharedValue(0);
  const startedAtUptime = useSharedValue(NOT_STARTED);
  const shownSeconds = useSharedValue(0);
  const running = useSharedValue(false);

  // 예약과 도착 사이에 정지될 수 있어 단계 재확인
  const finish = useCallback(() => setSession((current) => (current.phase === 'running' ? completeTimer(current) : current)), []);

  const counting = useFrameCallback((frame) => {
    'worklet';
    if (!running.value) return;
    if (startedAtUptime.value === NOT_STARTED) startedAtUptime.value = frame.timestamp;

    const remaining = remainingMs({
      remainingAtStartMs: remainingAtStart.value,
      startedAtUptime: startedAtUptime.value,
      nowUptime: frame.timestamp,
    });

    const seconds = millisecondsToSeconds(remaining);
    if (seconds !== shownSeconds.value) {
      shownSeconds.value = seconds;
      scheduleOnRN(setRemainingSeconds, seconds);
    }

    if (remaining === 0) {
      running.value = false;
      scheduleOnRN(finish);
    }
  }, false);

  useEffect(() => {
    counting.setActive(session.phase === 'running');
  }, [counting, session.phase]);

  useEffect(() => {
    if (session.phase !== 'running') return;

    activateKeepAwakeAsync().catch(() => {});
    return () => {
      deactivateKeepAwake().catch(() => {});
    };
  }, [session.phase]);

  const startCounting = useCallback(
    (remainingAtStartMs: number) => {
      scheduleOnUI(() => {
        'worklet';
        remainingAtStart.value = remainingAtStartMs;
        startedAtUptime.value = NOT_STARTED;
        shownSeconds.value = millisecondsToSeconds(remainingAtStartMs);
        running.value = true;
      });
      setRemainingSeconds(millisecondsToSeconds(remainingAtStartMs));
    },
    [remainingAtStart, startedAtUptime, shownSeconds, running],
  );

  const stopCounting = useCallback(() => {
    scheduleOnUI(() => {
      'worklet';
      running.value = false;
    });
  }, [running]);

  const play = useCallback(() => {
    const now = Date.now();

    if (session.phase === 'idle') {
      const next = startTimer({ session, now, settingMs: settingMinutes[session.mode] * MINUTE_IN_MS });
      startCounting(next.endsAt - now);
      setSession(next);
      return;
    }

    if (session.phase === 'running') {
      // 끝날 시각이 지났으면 완료 전이가 이미 예약된 것
      if (session.endsAt <= now) return;

      const next = pauseTimer({ session, now });
      stopCounting();
      setSession(next);
      return;
    }

    if (session.phase === 'paused') {
      const next = resumeTimer({ session, now });
      startCounting(next.endsAt - now);
      setSession(next);
    }
  }, [session, settingMinutes, startCounting, stopCounting]);

  useEffect(() => {
    if (session.phase !== 'running') return;

    // 백그라운드에서는 프레임이 돌지 않아 카운트다운이 멈춤. `SPEC.md` 남은 시간
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;

      const restored = restoreSession({ stored: session, now: Date.now(), stopped: false });
      if (restored.phase === 'running') startCounting(restored.endsAt - Date.now());
      setSession(restored);
    });

    return () => subscription.remove();
  }, [session, startCounting]);

  const stop = useCallback(() => {
    stopCounting();
    setRemainingSeconds(null);
    setSession(IDLE_SESSION);
  }, [stopCounting]);

  return { session, remainingSeconds, play, stop };
};
