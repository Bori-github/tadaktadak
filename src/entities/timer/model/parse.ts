import { type TimerMode } from './mode';
import { type TimerPhase, type TimerSession } from './session';
import { TIMER_DEFAULT, TIMER_RANGE } from '../config/minutes';

const PHASES: readonly string[] = ['idle', 'running', 'paused', 'done'];
const MODES: readonly string[] = ['focus', 'rest'];

/**
 * 저장 문자열에서 읽어 낸 타이머 세션 값. `SPEC.md` 기기에 저장하는 값
 *
 * @param raw - 기기 저장소에서 읽은 문자열. 없으면 `null`
 * @returns 이어갈 수 있는 타이머 세션 값. 지금 스키마와 맞지 않으면 `null`
 */
export const parseSession = (raw: string | null): TimerSession | null => {
  if (raw === null) return null;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof value !== 'object' || value === null) return null;

  const { phase, mode, endsAt, pausedRemainingMs } = value as Record<string, unknown>;
  if (typeof phase !== 'string' || !PHASES.includes(phase)) return null;
  if (typeof mode !== 'string' || !MODES.includes(mode)) return null;

  // 진행은 끝날 시각으로, 일시정지는 남은 밀리초로 남은 시간을 구함
  if (phase === 'running' && typeof endsAt !== 'number') return null;
  if (phase === 'paused' && typeof pausedRemainingMs !== 'number') return null;

  return {
    phase: phase as TimerPhase,
    mode: mode as TimerMode,
    endsAt: typeof endsAt === 'number' ? endsAt : null,
    pausedRemainingMs: typeof pausedRemainingMs === 'number' ? pausedRemainingMs : null,
  };
};

/**
 * 저장 문자열에서 읽어 낸 타이머 시간. `SPEC.md` 기기에 저장하는 값
 *
 * @param raw - 기기 저장소에서 읽은 문자열. 없으면 `null`
 * @returns `TIMER_RANGE` 안의 분. 읽을 수 없거나 범위 밖이면 `TIMER_DEFAULT`
 */
export const parseMinutes = (raw: string | null, mode: TimerMode): number => {
  if (raw === null) return TIMER_DEFAULT[mode];

  const minutes = Number(raw);
  const { min, max } = TIMER_RANGE[mode];
  if (!Number.isInteger(minutes) || minutes < min || minutes > max) return TIMER_DEFAULT[mode];

  return minutes;
};
