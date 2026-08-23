import { describe, expect, it } from '@jest/globals';

import { IDLE_SESSION, type TimerSession } from './session';
import { completeTimer, pauseTimer, resumeTimer, startTimer } from './transition';

const NOW = 1_700_000_000_000;
const SETTING_MS = 25 * 60_000;

const running: TimerSession = { phase: 'running', mode: 'focus', endsAt: NOW + 3 * 60_000, pausedRemainingMs: null };
const paused: TimerSession = { phase: 'paused', mode: 'focus', endsAt: null, pausedRemainingMs: 3 * 60_000 };

describe('단계 전이', () => {
  it('25분으로 시작하면 25분 뒤에 끝나는 진행이 된다', () => {
    expect(startTimer({ session: IDLE_SESSION, now: NOW, settingMs: SETTING_MS })).toEqual({
      phase: 'running',
      mode: 'focus',
      endsAt: NOW + SETTING_MS,
      pausedRemainingMs: null,
    });
  });

  it('3분 남은 진행을 일시정지하면 3분을 남긴다', () => {
    expect(pauseTimer({ session: running, now: NOW })).toEqual({
      phase: 'paused',
      mode: 'focus',
      endsAt: null,
      pausedRemainingMs: 3 * 60_000,
    });
  });

  it('3분 남긴 일시정지를 재개하면 3분 뒤에 끝나는 진행이 된다', () => {
    expect(resumeTimer({ session: paused, now: NOW })).toEqual({
      phase: 'running',
      mode: 'focus',
      endsAt: NOW + 3 * 60_000,
      pausedRemainingMs: null,
    });
  });

  it('진행이 완료되면 끝날 시각을 비운다', () => {
    expect(completeTimer(running)).toEqual({
      phase: 'done',
      mode: 'focus',
      endsAt: null,
      pausedRemainingMs: null,
    });
  });

  it('휴식 타이머를 시작해도 모드는 그대로다', () => {
    expect(startTimer({ session: { ...IDLE_SESSION, mode: 'rest' }, now: NOW, settingMs: SETTING_MS }).mode).toBe('rest');
  });
});
