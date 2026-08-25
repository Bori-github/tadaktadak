import { describe, expect, it } from '@jest/globals';

import { remainingMs, sessionRemainingMs } from './remaining';
import { IDLE_SESSION } from '../model/session';

const MINUTE = 60_000;

const remainingAfter = (elapsedMs: number, remainingAtStartMs = 25 * MINUTE) => remainingMs({ remainingAtStartMs, startedAtUptime: 1000, nowUptime: 1000 + elapsedMs });

describe('남은 시간', () => {
  it('25분 타이머가 1분 흐르면 24분 남는다', () => {
    expect(remainingAfter(MINUTE)).toBe(24 * MINUTE);
  });

  it('3분 남기고 재개하면 1분 흐른 뒤 2분 남는다', () => {
    expect(remainingAfter(MINUTE, 3 * MINUTE)).toBe(2 * MINUTE);
  });

  it.each([
    [25 * MINUTE - 1, 1],
    [25 * MINUTE, 0],
    [25 * MINUTE + 1, 0],
  ])('%i밀리초 흐르면 %i밀리초 남는다', (elapsedMs, expected) => {
    expect(remainingAfter(elapsedMs)).toBe(expected);
  });

  it('25분 타이머가 60분 지나도 0이다', () => {
    expect(remainingAfter(60 * MINUTE)).toBe(0);
  });
});

describe('복구한 단계의 남은 시간(밀리초)', () => {
  const now = 1_700_000_000_000;

  it('대기 상태는 남은 시간이 없다', () => {
    expect(sessionRemainingMs({ session: IDLE_SESSION, now })).toBeNull();
  });

  it('진행 상태는 끝날 시각까지 남은 시간이다', () => {
    expect(sessionRemainingMs({ session: { phase: 'running', mode: 'focus', endsAt: now + 3 * MINUTE }, now })).toBe(3 * MINUTE);
  });

  it('끝날 시각이 지난 진행 상태는 0이다', () => {
    expect(sessionRemainingMs({ session: { phase: 'running', mode: 'focus', endsAt: now - 1 }, now })).toBe(0);
  });

  it('일시정지 상태는 멈춘 시점에 남아 있던 시간이다', () => {
    expect(sessionRemainingMs({ session: { phase: 'paused', mode: 'focus', pausedRemainingMs: 90_000 }, now })).toBe(90_000);
  });

  it('완료 상태는 0이다', () => {
    expect(sessionRemainingMs({ session: { phase: 'done', mode: 'rest' }, now })).toBe(0);
  });
});
