import { type TimerMode } from './mode';

/** 타이머 단계. `DESIGN.md` §8 */
export const TIMER_PHASES = ['ready', 'running', 'paused', 'done'] as const;

export type TimerPhase = (typeof TIMER_PHASES)[number];

/** 진행 중. 남은 시간의 기준은 끝날 시각 */
export type RunningSession = { phase: 'running'; mode: TimerMode; endsAt: number };

/** 일시정지 중. 남은 시간의 기준은 멈춘 시점의 남은 밀리초 */
export type PausedSession = { phase: 'paused'; mode: TimerMode; pausedRemainingMs: number };

/** 타이머 세션 값. `SPEC.md` 기기에 저장하는 값 */
export type TimerSession = { phase: 'ready' | 'done'; mode: TimerMode } | RunningSession | PausedSession;

/** 집중 타이머 대기. 첫 실행과 정지 뒤의 값 */
export const READY_SESSION: TimerSession = Object.freeze({ phase: 'ready', mode: 'focus' });
