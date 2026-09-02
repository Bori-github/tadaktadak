import { READY_SESSION, type TimerSession } from './session';
import { completeTimer } from './transition';

type RestoreInput = {
  stored: TimerSession | null;
  now: number;
  stopped: boolean;
};

/**
 * 저장값으로 되돌린 타이머 세션 값. `SPEC.md` 앱 재실행
 *
 * @param input.stored - 기기에 저장된 타이머 세션 값. 없으면 `null`
 * @param input.now - 지금 시각 (밀리초)
 * @param input.stopped - Live Activity 정지 버튼이 남긴 정지됨 플래그
 * @returns 이어갈 타이머 세션 값. 이어갈 것이 없으면 집중 타이머 대기
 */
export const restoreSession = ({ stored, now, stopped }: RestoreInput): TimerSession => {
  if (stopped || stored === null) return READY_SESSION;

  if (stored.phase === 'paused' || stored.phase === 'completed') return stored;
  if (stored.phase !== 'running') return READY_SESSION;

  // 끝날 시각이 지금과 같으면 종료된 것.
  return stored.endsAt > now ? stored : completeTimer(stored);
};
