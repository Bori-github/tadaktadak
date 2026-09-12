import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Vibration } from 'react-native';
import { useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN, scheduleOnUI } from 'react-native-worklets';

import { hapticPattern } from '@modules/haptic-pattern';
import { liveActivity } from '@modules/live-activity';

import { millisecondsToMinutes } from '../lib/minutes';
import { millisecondsToSeconds } from '../lib/seconds';

import {
  advanceTimer,
  completeTimer,
  completedEffectRemainingMs,
  COMPLETION_PATTERN,
  READY_SESSION,
  loadSession,
  notRunningRemainingMs,
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

// `StopTimerIntent`가 저장한 `endsAt`이 현재 세션과 일치할 때만 정지. 일치하지 않는 경우, 이전 세션 값이라 판단함
const isStoppedOnLockScreen = (stored: TimerSession | null): boolean => {
  // 네이티브 모듈이 없는 빌드에서 `null`. 잠금화면 정지 버튼도 없으므로 정지되지 않은 것으로 봄
  const stoppedEndsAt = liveActivity?.consumeStoppedEndsAt() ?? null;

  return stoppedEndsAt !== null && stored?.phase === 'running' && stored.endsAt === stoppedEndsAt;
};

const vibrateCompletion = (mode: TimerMode): void => {
  // 네이티브 모듈이 없는 빌드에서 `null`. 재생만 건너뛰고 타이머 완료는 그대로 진행
  // JS 값을 Swift 타입으로 변환하다 실패하는 경우, 네이티브 대체 진동이 실행되지 않으므로 시스템 진동으로 대체
  hapticPattern?.playAsync(COMPLETION_PATTERN[mode]).catch(() => Vibration.vibrate());
};

type TimerSessionInput = {
  settingMinutes: Record<TimerMode, number>;
  toSeconds?: (ms: number) => number;
  toMinutes?: (ms: number) => number;
};

interface TimerSessionState {
  session: TimerSession;
  /** 저장값 읽기가 끝났거나 사용자가 조작했으면 true. `false`인 동안 `session`은 `READY_SESSION`이고 저장값이 아직 반영되지 않음 */
  isSettled: boolean;
  /** 카운트다운 중인 남은 시간(초). 대기에서는 `null` */
  remainingSeconds: number | null;
  /** 남은 시간(분). 매 프레임 갱신되어 호와 손잡이 각도가 읽음 */
  remainingMinutes: SharedValue<number>;
  /** 카운트다운 중인 타이머. 남은 분과 같은 워클릿에서 바뀜 */
  countingMode: SharedValue<TimerMode>;
  play: () => void;
  stop: () => void;
}

/**
 * 타이머 세션 값과 카운트다운. `SPEC.md` 시간 모델
 *
 * @param input.settingMinutes - 집중과 휴식의 설정 시간(분)
 * @param [input.toSeconds] - 남은 밀리초를 화면에 보여 줄 초로 바꾸는 함수. 기본은 실제 시간
 * @param [input.toMinutes] - 남은 밀리초를 화면에 보여 줄 분으로 바꾸는 함수. 기본은 실제 시간
 * @returns 타이머 세션 상태와 재생·정지 조작
 */
export const useTimerSession = ({ settingMinutes, toSeconds = millisecondsToSeconds, toMinutes = millisecondsToMinutes }: TimerSessionInput): TimerSessionState => {
  const [session, setSession] = useState<TimerSession>(READY_SESSION);
  // 진행 단계에서만 사용하는 값
  const [countedSeconds, setCountedSeconds] = useState(0);

  // 저장값을 읽거나 사용자가 조작하면 true. 늦게 끝난 읽기가 그 사이의 조작을 덮는 것 방지
  const settled = useRef(false);
  // `settled`는 참조라 바뀌어도 리렌더가 없음. 밖에서 이 값을 이펙트 의존성으로 쓰려면 상태가 따로 필요
  const [isSettled, setIsSettled] = useState(false);

  // `consumeStoppedEndsAt`이 읽고 지운 값을 기억. `AppState` active와 `onStopped`가 겹쳐 나중 호출이 `null`을 읽어도 정지를 유지
  const stoppedEndsAt = useRef<number | null>(null);

  const remainingAtStart = useSharedValue(0);
  const startedAtUptime = useSharedValue(NOT_STARTED);
  const shownSeconds = useSharedValue(0);
  const running = useSharedValue(false);
  const remainingMinutes = useSharedValue(0);
  const countingMode = useSharedValue<TimerMode>('focus');

  // 완료로 넘어간 타이머. 진동이 단계 재확인을 거치게 하려고 여기를 지나감
  const completedMode = useRef<TimerMode | null>(null);
  // 갱신 함수는 렌더 단계에서 돌아 정지보다 늦음. 기록을 지우는 대신 무시할 것을 표시
  const isStopRequested = useRef(false);

  // 예약과 도착 사이에 정지될 수 있어 단계 재확인
  const finish = useCallback(
    () =>
      setSession((current) => {
        if (current.phase !== 'running') return current;

        // 갱신 함수가 두 번 불려도 같은 값이라 결과가 같음
        completedMode.current = current.mode;

        return completeTimer(current);
      }),
    [],
  );

  useEffect(() => {
    const mode = completedMode.current;

    completedMode.current = null;

    if (mode === null || isStopRequested.current) return;

    // 백그라운드에서 끝난 것은 활성 전환보다 먼저 도착한 프레임이 완료로 만듦. 알림이 이미 울렸으므로 건너뜀
    // `inactive`는 제어센터·전화 배너처럼 화면이 보이는 상태라 여기 넣지 않음
    if (AppState.currentState === 'background') return;

    vibrateCompletion(mode);
  }, [session]);

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
      scheduleOnRN(setCountedSeconds, seconds);
    }

    // 포그라운드인 경우 다음 조건에 부합
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
    (remainingAtStartMs: number, mode: TimerMode) => {
      const shown = toSeconds(remainingAtStartMs);
      const shownMinutes = toMinutes(remainingAtStartMs);

      isStopRequested.current = false;

      scheduleOnUI(() => {
        'worklet';
        remainingAtStart.value = remainingAtStartMs;
        startedAtUptime.value = NOT_STARTED;
        shownSeconds.value = shown;
        remainingMinutes.value = shownMinutes;
        countingMode.value = mode;
        running.value = true;
      });
      setCountedSeconds(shown);
    },
    [remainingAtStart, startedAtUptime, shownSeconds, remainingMinutes, countingMode, running, toSeconds, toMinutes],
  );

  const stopCounting = useCallback(() => {
    scheduleOnUI(() => {
      'worklet';
      running.value = false;
    });
  }, [running]);

  const applySession = useCallback(
    (next: TimerSession, now: number) => {
      const remaining = sessionRemainingMs({ session: next, now }) ?? 0;

      if (next.phase === 'running') startCounting(remaining, next.mode);
      else {
        const shownMinutes = toMinutes(remaining);

        scheduleOnUI(() => {
          'worklet';
          // 백그라운드에서 끝난 뒤 돌아오면 낡은 시작 시각으로 프레임이 완료를 다시 만듦
          running.value = false;
          remainingMinutes.value = shownMinutes;
          countingMode.value = next.mode;
        });
      }

      setSession(next);
    },
    [startCounting, remainingMinutes, countingMode, running, toMinutes],
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
        setIsSettled(true);

        const next = restoreSession({ stored, now, stopped: isStoppedOnLockScreen(stored) });

        applySession(next, now);
        // 초기값 READY_SESSION과 같은 객체면 리렌더가 없어 [session] 이펙트가 돌지 않으므로 여기서 한 번 저장
        saveSession(next).catch(() => {});
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

  const restMs = settingMinutes.rest * MINUTE_IN_MS;
  const focusMs = settingMinutes.focus * MINUTE_IN_MS;

  const startsRestAutomatically = session.phase === 'completed' && session.mode === 'focus' && restMs > 0;

  useEffect(() => {
    if (!startsRestAutomatically) return;

    const now = Date.now();

    // 집중 타이머 완료에서 휴식 타이머 진행으로 바뀌며 리렌더링이 1회 늘어남
    // eslint-disable-next-line react-hooks/set-state-in-effect
    applySession(advanceTimer({ session, now, restMs, focusMs }), now);
  }, [startsRestAutomatically, session, restMs, focusMs, applySession]);

  // 완료 중 리렌더마다 아래 이펙트가 다시 돌아 남은 시간을 새로 재는 것을 막으려고, 세션 객체가 아닌 끝난 시각을 의존성으로 둠
  const returnsToReadyAt = session.phase === 'completed' && restMs === 0 ? session.completedAt : null;

  useEffect(() => {
    if (returnsToReadyAt === null) return;

    const waiting = setTimeout(() => applySession(READY_SESSION, Date.now()), completedEffectRemainingMs({ startedAt: returnsToReadyAt, now: Date.now() }));

    return () => clearTimeout(waiting);
  }, [returnsToReadyAt, applySession]);

  const play = useCallback(() => {
    settled.current = true;
    setIsSettled(true);

    const now = Date.now();

    if (session.phase === 'ready') {
      const next = startTimer({ session, now, settingMs: settingMinutes[session.mode] * MINUTE_IN_MS });
      startCounting(next.endsAt - now, next.mode);
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
      startCounting(next.endsAt - now, next.mode);
      setSession(next);
      return;
    }

    if (session.phase === 'completed') applySession(advanceTimer({ session, now, restMs, focusMs }), now);
  }, [session, settingMinutes, restMs, focusMs, startCounting, stopCounting, applySession, running]);

  // 진행 세션을 지금 시각과 정지 값에 맞춤. `AppState` active와 `onStopped`가 겹쳐도 한 번 읽은 정지 값을 유지
  const restoreRunningSession = useCallback(() => {
    const consumed = liveActivity?.consumeStoppedEndsAt() ?? null;

    if (consumed !== null) stoppedEndsAt.current = consumed;

    const now = Date.now();
    const stopped = session.phase === 'running' && session.endsAt === stoppedEndsAt.current;

    applySession(restoreSession({ stored: session, now, stopped }), now);
  }, [session, applySession]);

  useEffect(() => {
    if (session.phase !== 'running') return;

    // 백그라운드에서는 프레임이 돌지 않아 카운트다운이 멈춤. `SPEC.md` 남은 시간
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;

      restoreRunningSession();
    });

    return () => subscription.remove();
  }, [session.phase, restoreRunningSession]);

  useEffect(() => {
    if (session.phase !== 'running') return;

    // 앱이 열리며 정지될 때 `AppState` active가 `StopTimerIntent`의 저장보다 먼저 올 수 있어, `onStopped`에서도 세션을 맞춤
    const subscription = liveActivity?.addListener('onStopped', () => {
      restoreRunningSession();
    });

    return () => subscription?.remove();
  }, [session.phase, restoreRunningSession]);

  const stop = useCallback(() => {
    settled.current = true;
    setIsSettled(true);

    isStopRequested.current = true;

    stopCounting();
    setSession(READY_SESSION);
  }, [stopCounting]);

  const remainingSeconds = useMemo(() => {
    if (session.phase === 'running') return countedSeconds;

    const remaining = notRunningRemainingMs(session);

    return remaining === null ? null : toSeconds(remaining);
  }, [session, countedSeconds, toSeconds]);

  return { session, isSettled, remainingSeconds, remainingMinutes, countingMode, play, stop };
};
