import { type NotRunningSession, type TimerSession } from '../model/session';

type RemainingInput = {
  remainingAtStartMs: number;
  startedAtUptime: number;
  nowUptime: number;
};

/**
 * 진행 중 남은 시간. `SPEC.md` 남은 시간
 *
 * @param input.remainingAtStartMs - 시작 또는 재개 시점에 남아 있던 시간 (밀리초). 시작은 설정 시간, 재개는 일시정지 시 남은 밀리초
 * @param input.startedAtUptime - 시작 또는 재개한 기기 가동 시간 (밀리초)
 * @param input.nowUptime - 지금 기기 가동 시간 (밀리초)
 * @returns 0이 하한인 남은 밀리초
 */
export const remainingMs = ({ remainingAtStartMs, startedAtUptime, nowUptime }: RemainingInput): number => {
  'worklet';
  return Math.max(0, remainingAtStartMs - (nowUptime - startedAtUptime));
};

/**
 * 진행이 아닌 단계의 남은 시간(밀리초). 지금 시각이 필요 없어 렌더 중에도 부를 수 있다
 *
 * @param session - 진행이 아닌 타이머 세션 값
 * @returns 대기 상태는 `null`, 완료는 0, 일시정지는 멈춘 시점에 남아 있던 밀리초
 */
export const notRunningRemainingMs = (session: NotRunningSession): number | null => {
  switch (session.phase) {
    case 'ready':
      return null;
    case 'completed':
      return 0;
    case 'paused':
      return session.pausedRemainingMs;
  }
};

type SessionRemainingInput = {
  session: TimerSession;
  now: number;
};

/**
 * 복구한 단계의 남은 시간(밀리초). `SPEC.md` 앱 재실행
 *
 * @param input.session - 저장값으로 되돌린 타이머 세션 값
 * @param input.now - 지금 시각 (밀리초)
 * @returns 남은 밀리초. 끝날 시각이 지났으면 0, 대기는 `null`
 */
export const sessionRemainingMs = ({ session, now }: SessionRemainingInput): number | null =>
  session.phase === 'running' ? Math.max(0, session.endsAt - now) : notRunningRemainingMs(session);
