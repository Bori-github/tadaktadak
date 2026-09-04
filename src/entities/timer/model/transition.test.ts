import { describe, expect, it } from '@jest/globals';

import { READY_SESSION, type CompletedSession, type PausedSession, type RunningSession } from './session';
import { advanceTimer, completeTimer, pauseTimer, resumeTimer, startTimer } from './transition';
import { MINUTE_IN_MS } from '../config/minutes';
import { NOW } from '../lib/fixtures';

const SETTING_MS = 25 * MINUTE_IN_MS;
const REST_MS = 5 * MINUTE_IN_MS;

/** 25분으로 시작해 3분 남은 자리 */
const STARTED_AT = NOW - 22 * MINUTE_IN_MS;

const running: RunningSession = { phase: 'running', mode: 'focus', startedAt: STARTED_AT, endsAt: NOW + 3 * MINUTE_IN_MS };
const paused: PausedSession = { phase: 'paused', mode: 'focus', startedAt: STARTED_AT, pausedRemainingMs: 3 * MINUTE_IN_MS };
const focusCompleted: CompletedSession = { phase: 'completed', mode: 'focus' };

describe('단계 전이', () => {
  it('25분으로 시작하면 25분 뒤에 끝나는 진행이 된다', () => {
    expect(startTimer({ session: READY_SESSION, now: NOW, settingMs: SETTING_MS })).toEqual({
      phase: 'running',
      mode: 'focus',
      startedAt: NOW,
      endsAt: NOW + SETTING_MS,
    });
  });

  it('3분 남은 진행을 일시정지하면 3분을 남긴다', () => {
    expect(pauseTimer({ session: running, now: NOW })).toEqual({
      phase: 'paused',
      mode: 'focus',
      startedAt: STARTED_AT,
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
      startedAt: STARTED_AT,
      endsAt: NOW + 3 * MINUTE_IN_MS,
    });
  });

  it('일시정지했다 재개해도 시작 시각은 그대로다', () => {
    const stopped = pauseTimer({ session: running, now: NOW });

    expect(resumeTimer({ session: stopped, now: NOW + MINUTE_IN_MS }).startedAt).toBe(running.startedAt);
  });

  it('집중 타이머가 완료된 경우 끝날 시각 없이 단계와 모드 값을 가진다', () => {
    expect(completeTimer(running)).toEqual({ phase: 'completed', mode: 'focus' });
  });

  it('휴식 타이머가 완료된 경우 집중 타이머 대기 값을 가진다', () => {
    expect(completeTimer({ phase: 'running', mode: 'rest', startedAt: STARTED_AT, endsAt: NOW })).toEqual(READY_SESSION);
  });

  it('휴식 타이머를 시작해도 모드는 그대로다', () => {
    expect(startTimer({ session: { phase: 'ready', mode: 'rest' }, now: NOW, settingMs: SETTING_MS }).mode).toBe('rest');
  });
});

describe('완료에서 다음으로', () => {
  it('집중 타이머가 끝나고 휴식 타이머가 5분이면 5분 뒤에 끝나는 휴식 진행이 된다', () => {
    expect(advanceTimer({ session: focusCompleted, now: NOW, restMs: REST_MS, focusMs: SETTING_MS })).toEqual({
      phase: 'running',
      mode: 'rest',
      startedAt: NOW,
      endsAt: NOW + REST_MS,
    });
  });

  it('집중 타이머가 끝나고 휴식 타이머가 0분이면 집중 진행이 다시 시작된다', () => {
    expect(advanceTimer({ session: focusCompleted, now: NOW, restMs: 0, focusMs: SETTING_MS })).toEqual({
      phase: 'running',
      mode: 'focus',
      startedAt: NOW,
      endsAt: NOW + SETTING_MS,
    });
  });
});
