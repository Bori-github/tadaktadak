import { TIMER_MODES, type TimerMode } from './mode';
import { TIMER_PHASES, type TimerPhase, type TimerSession } from './session';
import { TIMER_DEFAULT, TIMER_RANGE } from '../config/minutes';

const isPhase = (value: unknown): value is TimerPhase => TIMER_PHASES.includes(value as TimerPhase);
const isMode = (value: unknown): value is TimerMode => TIMER_MODES.includes(value as TimerMode);

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
  if (!isPhase(phase)) return null;
  if (!isMode(mode)) return null;

  // 진행은 끝날 시각으로, 일시정지는 남은 밀리초로 남은 시간을 구함
  if (phase === 'running') return typeof endsAt === 'number' ? { phase, mode, endsAt } : null;
  if (phase === 'paused') return typeof pausedRemainingMs === 'number' ? { phase, mode, pausedRemainingMs } : null;

  return { phase, mode };
};

/**
 * 저장 문자열에서 읽어 낸 타이머 시간. `SPEC.md` 기기에 저장하는 값
 *
 * @param raw - 기기 저장소에서 읽은 문자열. 없으면 `null`
 * @returns `TIMER_RANGE` 안의 분. 읽을 수 없거나 범위 밖이면 `TIMER_DEFAULT`
 */
export const parseMinutes = (raw: string | null, mode: TimerMode): number => {
  // Number는 빈 문자열을 0으로, `0x10`을 16으로, 앞뒤 공백을 무시하고 읽음
  if (raw === null || !/^\d+$/.test(raw)) return TIMER_DEFAULT[mode];

  const minutes = Number.parseInt(raw, 10);
  const { min, max } = TIMER_RANGE[mode];
  if (minutes < min || minutes > max) return TIMER_DEFAULT[mode];

  return minutes;
};
