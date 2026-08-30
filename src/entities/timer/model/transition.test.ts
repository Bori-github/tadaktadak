import { describe, expect, it } from '@jest/globals';

import { READY_SESSION, type PausedSession, type RunningSession } from './session';
import { completeTimer, pauseTimer, resumeTimer, startTimer } from './transition';
import { MINUTE_IN_MS } from '../config/minutes';
import { NOW } from '../lib/fixtures';

const SETTING_MS = 25 * MINUTE_IN_MS;

const running: RunningSession = { phase: 'running', mode: 'focus', endsAt: NOW + 3 * MINUTE_IN_MS };
const paused: PausedSession = { phase: 'paused', mode: 'focus', pausedRemainingMs: 3 * MINUTE_IN_MS };

describe('단계 전이', () => {
  it('25분으로 시작하면 25분 뒤에 끝나는 진행이 된다', () => {
    expect(startTimer({ session: READY_SESSION, now: NOW, settingMs: SETTING_MS })).toEqual({
      phase: 'running',
      mode: 'focus',
      endsAt: NOW + SETTING_MS,
    });
  });

  it('3분 남은 진행을 일시정지하면 3분을 남긴다', () => {
    expect(pauseTimer({ session: running, now: NOW })).toEqual({
      phase: 'paused',
      mode: 'focus',
      pausedRemainingMs: 3 * MINUTE_IN_MS,
    });
  });

  it('끝날 시각이 1분 지난 뒤 일시정지하면 0을 남긴다', () => {
    expect(pauseTimer({ session: running, now: NOW + 4 * MINUTE_IN_MS }).pausedRemainingMs).toBe(0);
  });

  it('3분 남긴 일시정지를 재개하면 3분 뒤에 끝나는 진행이 된다', () => {
    expect(resumeTimer({ session: paused, now: NOW })).toEqual({
      phase: 'running',
      mode: 'focus',
      endsAt: NOW + 3 * MINUTE_IN_MS,
    });
  });

  it('진행을 완료하면 모드만 남는다', () => {
    expect(completeTimer(running)).toEqual({ phase: 'completed', mode: 'focus' });
  });

  it('휴식 타이머를 시작해도 모드는 그대로다', () => {
    expect(startTimer({ session: { phase: 'ready', mode: 'rest' }, now: NOW, settingMs: SETTING_MS }).mode).toBe('rest');
  });
});
