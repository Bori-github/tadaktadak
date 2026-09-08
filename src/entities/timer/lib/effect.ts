import { COMPLETED_EFFECT_MS } from '../config/effect';
import { type TimerSession } from '../model/session';

type RemainingInput = {
  startedAt: number;
  now: number;
};

/**
 * 완료 연출이 시작된 시각 (밀리초). `DESIGN.md` §9 완료
 *
 * @param session - 지금 타이머 세션 값
 * @returns 집중 타이머가 완료된 시각. 연출이 없는 단계에서는 `null`
 */
export const completedEffectStartedAt = (session: TimerSession): number | null => {
  if (session.phase === 'completed') return session.mode === 'focus' ? session.completedAt : null;

  // 휴식 타이머는 집중 타이머가 완료된 시각부터 시작하므로 연출이 그 자리에서 이어짐
  if (session.phase !== 'running' || session.mode !== 'rest') return null;

  return session.startedAt;
};

/**
 * 완료 연출이 끝나기까지 남은 시간 (밀리초). `DESIGN.md` §9 완료
 *
 * @param input.startedAt - 연출이 시작된 시각 (밀리초)
 * @param input.now - 지금 시각 (밀리초)
 * @returns 남은 시간. 이미 끝났으면 0
 */
export const completedEffectRemainingMs = ({ startedAt, now }: RemainingInput): number => Math.max(0, startedAt + COMPLETED_EFFECT_MS - now);
