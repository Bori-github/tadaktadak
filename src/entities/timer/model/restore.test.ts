import { describe, expect, it } from '@jest/globals';

import { restoreSession } from './restore';
import { READY_SESSION, type PausedSession, type RunningSession } from './session';
import { MINUTE_IN_MS } from '../config/minutes';
import { NOW } from '../lib/fixtures';

const runningUntil = (endsAt: number): RunningSession => ({ phase: 'running', mode: 'focus', endsAt });
const pausedRest: PausedSession = { phase: 'paused', mode: 'rest', pausedRemainingMs: 3 * MINUTE_IN_MS };

describe('앱 재실행', () => {
  it('일시정지 중에 종료됐으면 모드까지 그대로 돌아온다', () => {
    expect(restoreSession({ stored: pausedRest, now: NOW, stopped: false })).toEqual(pausedRest);
  });

  it('진행 중에 종료됐고 1분 남았으면 진행으로 돌아온다', () => {
    const stored = runningUntil(NOW + MINUTE_IN_MS);
    expect(restoreSession({ stored, now: NOW, stopped: false })).toEqual(stored);
  });

  it.each([
    { label: '1분 전에 끝났으면', endsAt: NOW - MINUTE_IN_MS },
    { label: '끝날 시각이 지금과 같으면', endsAt: NOW },
  ])('진행 중에 종료됐고 $label 완료로 돌아온다', ({ endsAt }) => {
    expect(restoreSession({ stored: runningUntil(endsAt), now: NOW, stopped: false })).toEqual({ phase: 'done', mode: 'focus' });
  });

  it.each<{ label: string; phase: 'ready' | 'done' }>([
    { label: '대기 상태', phase: 'ready' },
    { label: '완료 상태', phase: 'done' },
  ])('$label로 저장됐으면 집중 타이머 대기다', ({ phase }) => {
    expect(restoreSession({ stored: { phase, mode: 'rest' }, now: NOW, stopped: false })).toEqual(READY_SESSION);
  });

  it('저장값이 없으면 집중 타이머 대기다', () => {
    expect(restoreSession({ stored: null, now: NOW, stopped: false })).toEqual(READY_SESSION);
  });

  it('정지됨 플래그가 있으면 저장값을 버리고 집중 타이머 대기다', () => {
    expect(restoreSession({ stored: runningUntil(NOW + MINUTE_IN_MS), now: NOW, stopped: true })).toEqual(READY_SESSION);
  });
});
