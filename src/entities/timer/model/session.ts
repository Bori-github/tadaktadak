import type { TimerMode } from './mode';

/** 타이머 단계. `DESIGN.md` §8 */
export type TimerPhase = 'idle' | 'running' | 'paused' | 'done';

/** 타이머 세션 값. `SPEC.md` 기기에 저장하는 값 */
export type TimerSession = {
  phase: TimerPhase;
  mode: TimerMode;
  /** 끝날 시각 (밀리초). 진행 중에만 채움 */
  endsAt: number | null;
  /** 일시정지 시 남은 밀리초. 일시정지에만 채움 */
  pausedRemainingMs: number | null;
};

/** 집중 타이머 대기. 첫 실행과 정지 뒤의 값 */
export const IDLE_SESSION: TimerSession = {
  phase: 'idle',
  mode: 'focus',
  endsAt: null,
  pausedRemainingMs: null,
};
