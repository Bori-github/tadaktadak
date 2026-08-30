import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { millisecondsToMinutes } from '../lib/minutes';
import { millisecondsToSeconds } from '../lib/seconds';

import {
  completeTimer,
  READY_SESSION,
  loadSession,
  MINUTE_IN_MS,
  pauseTimer,
  remainingMs,
  restoreSession,
  resumeTimer,
  saveSession,
  sessionRemainingMs,
  startTimer,
  type TimerMode,
  type TimerSession,
} from '@/entities/timer';

/** 기기 가동 시간을 첫 프레임에서 채우기 전 값 */
const NOT_STARTED = -1;

type TimerSessionInput = {
  settingMinutes: Record<TimerMode, number>;
  toSeconds?: (ms: number) => number;
  toMinutes?: (ms: number) => number;
};

/**
 * 타이머 세션 값과 카운트다운. `SPEC.md` 시간 모델
 *
 * @param input.settingMinutes - 집중과 휴식의 설정 시간(분)
 * @param [input.toSeconds] - 남은 밀리초를 화면에 보여 줄 초로 바꾸는 함수. 기본은 실제 시간
 * @param [input.toMinutes] - 남은 밀리초를 화면에 보여 줄 분으로 바꾸는 함수. 기본은 실제 시간
 * @returns 지금 타이머 세션 값, 카운트다운 중인 남은 시간(초, 대기에서는 `null`), 남은 시간(분), 재생·정지 조작
 */
interface TimerSessionState {
  session: TimerSession;
  /** 카운트다운 중인 남은 시간(초). 대기에서는 `null` */
  remainingSeconds: number | null;
  /** 남은 시간(분). 매 프레임 갱신되어 호와 손잡이 각도가 읽음 */
  remainingMinutes: SharedValue<number>;
  play: () => void;
  stop: () => void;
}

export const useTimerSession = ({ settingMinutes, toSeconds = millisecondsToSeconds, toMinutes = millisecondsToMinutes }: TimerSessionInput): TimerSessionState => {
  const [session, setSession] = useState<TimerSession>(READY_SESSION);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // 저장값을 읽거나 사용자가 조작하면 true. 늦게 끝난 읽기가 그 사이의 조작을 덮는 것 방지
  const settled = useRef(false);

  const remainingAtStart = useSharedValue(0);
  const startedAtUptime = useSharedValue(NOT_STARTED);
  const shownSeconds = useSharedValue(0);
  const running = useSharedValue(false);
  const remainingMinutes = useSharedValue(0);

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

    remainingMinutes.value = toMinutes(remaining);

    const seconds = toSeconds(remaining);
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

    // 실패하면 화면이 그대로 꺼짐. 남은 시간은 활성 전환에서 endsAt으로 다시 맞춰짐
    activateKeepAwakeAsync().catch(() => {});
    return () => {
      deactivateKeepAwake().catch(() => {});
    };
  }, [session.phase]);

  const startCounting = useCallback(
    (remainingAtStartMs: number) => {
      const shown = toSeconds(remainingAtStartMs);
      const shownMinutes = toMinutes(remainingAtStartMs);

      scheduleOnUI(() => {
        'worklet';
        remainingAtStart.value = remainingAtStartMs;
        startedAtUptime.value = NOT_STARTED;
        shownSeconds.value = shown;
        remainingMinutes.value = shownMinutes;
        running.value = true;
      });
      setRemainingSeconds(shown);
    },
    [remainingAtStart, startedAtUptime, shownSeconds, remainingMinutes, running, toSeconds, toMinutes],
  );

  const stopCounting = useCallback(() => {
    scheduleOnUI(() => {
      'worklet';
      running.value = false;
    });
  }, [running]);

  const applySession = useCallback(
    (next: TimerSession, now: number) => {
      const remaining = sessionRemainingMs({ session: next, now });

      if (remaining === null) setRemainingSeconds(null);
      else if (next.phase === 'running') startCounting(remaining);
      else {
        const shownMinutes = toMinutes(remaining);

        setRemainingSeconds(toSeconds(remaining));
        scheduleOnUI(() => {
          'worklet';
          remainingMinutes.value = shownMinutes;
        });
      }

      setSession(next);
    },
    [startCounting, remainingMinutes, toSeconds, toMinutes],
  );

  useEffect(() => {
    if (settled.current) return;

    let live = true;

    // 실패하면 집중 타이머 대기로 시작함
    loadSession()
      .catch(() => null)
      .then((stored) => {
        if (!live || settled.current) return;

        const now = Date.now();

        settled.current = true;
        applySession(restoreSession({ stored, now, stopped: false }), now);
      });

    return () => {
      live = false;
    };
  }, [applySession]);

  useEffect(() => {
    if (!settled.current) return;

    // 실패하면 앱을 다시 켤 때 이전 단계로 돌아감
    saveSession(session).catch(() => {});
  }, [session]);

  const play = useCallback(() => {
    settled.current = true;

    const now = Date.now();

    if (session.phase === 'ready') {
      const next = startTimer({ session, now, settingMs: settingMinutes[session.mode] * MINUTE_IN_MS });
      startCounting(next.endsAt - now);
      setSession(next);
      return;
    }

    if (session.phase === 'running') {
      // 완료를 정하는 기기 가동 시간과 같은 값을 보아, 지금 시각이 뛸 때 일시정지가 막히는 것 방지
      if (!running.value) return;

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
  }, [session, settingMinutes, startCounting, stopCounting, running]);

  useEffect(() => {
    if (session.phase !== 'running') return;

    // 백그라운드에서는 프레임이 돌지 않아 카운트다운이 멈춤. `SPEC.md` 남은 시간
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;

      const now = Date.now();
      applySession(restoreSession({ stored: session, now, stopped: false }), now);
    });

    return () => subscription.remove();
  }, [session, applySession]);

  const stop = useCallback(() => {
    settled.current = true;

    stopCounting();
    setRemainingSeconds(null);
    setSession(READY_SESSION);
  }, [stopCounting]);

  return { session, remainingSeconds, remainingMinutes, play, stop };
};
