import { type PausedSession, type RunningSession, type TimerSession } from './session';

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
  endsAt: now + session.pausedRemainingMs,
});

/**
 * 시간이 다 됨. 사용자 조작이 아닌 전이
 *
 * @param session - 진행 중이던 타이머 세션 값
 * @returns 끝날 시각을 비운 완료
 */
export const completeTimer = (session: TimerSession): TimerSession => ({
  phase: 'done',
  mode: session.mode,
});
