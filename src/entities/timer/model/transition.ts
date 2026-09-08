import { READY_SESSION, type CompletedSession, type PausedSession, type RunningSession, type TimerSession } from './session';

type StartInput = {
  session: TimerSession;
  now: number;
  settingMs: number;
};

type PauseInput = {
  session: RunningSession;
  now: number;
};

type ResumeInput = {
  session: PausedSession;
  now: number;
};

type AdvanceInput = {
  session: CompletedSession;
  now: number;
  restMs: number;
  focusMs: number;
};

/**
 * 대기에서 시작. `SPEC.md` 남은 시간
 *
 * @param input.session - 지금 타이머 세션 값. 모드를 이어받는 자리
 * @param input.now - 지금 시각 (밀리초)
 * @param input.settingMs - 설정한 타이머 시간 (밀리초)
 * @returns 지금 + 설정 시간에 끝나는 진행
 */
export const startTimer = ({ session, now, settingMs }: StartInput): RunningSession => ({
  phase: 'running',
  mode: session.mode,
  startedAt: now,
  endsAt: now + settingMs,
});

/**
 * 진행에서 일시정지. `SPEC.md` 기기에 저장하는 값
 *
 * @param input.session - 진행 중인 타이머 세션 값
 * @param input.now - 지금 시각 (밀리초)
 * @returns 남은 밀리초를 담은 일시정지. 0이 하한
 */
export const pauseTimer = ({ session, now }: PauseInput): PausedSession => ({
  phase: 'paused',
  mode: session.mode,
  startedAt: session.startedAt,
  // 완료 전이는 프레임 콜백이 몰아서, 끝날 시각이 지난 뒤에 눌리는 틈
  pausedRemainingMs: Math.max(0, session.endsAt - now),
});

/**
 * 일시정지에서 재개. `SPEC.md` 기기에 저장하는 값
 *
 * @param input.session - 일시정지 중인 타이머 세션 값
 * @param input.now - 지금 시각 (밀리초)
 * @returns 지금 + 남은 밀리초에 끝나는 진행
 */
export const resumeTimer = ({ session, now }: ResumeInput): RunningSession => ({
  phase: 'running',
  mode: session.mode,
  startedAt: session.startedAt,
  endsAt: now + session.pausedRemainingMs,
});

/**
 * 타이머 시간 완료. `DESIGN.md` §8 휴식 타이머
 *
 * @param session - 진행 중이던 타이머 세션 값
 * @returns 집중은 끝날 시각을 끝난 시각으로 옮긴 완료, 휴식은 연출이 없어 집중 타이머 대기
 */
export const completeTimer = (session: RunningSession): TimerSession =>
  session.mode === 'rest' ? READY_SESSION : { phase: 'completed', mode: session.mode, completedAt: session.endsAt };

/**
 * 완료에서 다음 단계로. `DESIGN.md` §8 휴식 타이머
 *
 * @param input.session - 완료한 타이머 세션 값
 * @param input.now - 지금 시각 (밀리초)
 * @param input.restMs - 설정한 휴식 타이머 시간 (밀리초)
 * @param input.focusMs - 설정한 집중 타이머 시간 (밀리초)
 * @returns 집중 완료는 휴식이 있으면 휴식 진행, 없으면 집중 진행. 그 밖은 집중 타이머 대기
 */
export const advanceTimer = ({ session, now, restMs, focusMs }: AdvanceInput): TimerSession => {
  if (session.mode !== 'focus') return READY_SESSION;
  if (restMs === 0) return { phase: 'running', mode: 'focus', startedAt: now, endsAt: now + focusMs };

  // 백그라운드에서 집중 타이머가 완료되고 포그라운드로 돌아왔을 때, 정해진 휴식 타이머 완료 시각을 수행하기 위해 `completedAt`을 기준으로 시간 계산
  const endsAt = session.completedAt + restMs;

  return endsAt > now ? { phase: 'running', mode: 'rest', startedAt: session.completedAt, endsAt } : READY_SESSION;
};
