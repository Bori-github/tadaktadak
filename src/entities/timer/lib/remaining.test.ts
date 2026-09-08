import { describe, expect, it } from '@jest/globals';

import { NOW } from './fixtures';
import { remainingMs, sessionRemainingMs } from './remaining';
import { MINUTE_IN_MS } from '../config/minutes';
import { READY_SESSION } from '../model/session';

const remainingAfter = (elapsedMs: number, remainingAtStartMs = 25 * MINUTE_IN_MS) => remainingMs({ remainingAtStartMs, startedAtUptime: 1000, nowUptime: 1000 + elapsedMs });

describe('남은 시간', () => {
  it('25분 타이머가 1분 흐르면 24분 남는다', () => {
    expect(remainingAfter(MINUTE_IN_MS)).toBe(24 * MINUTE_IN_MS);
  });

  it('3분 남기고 재개하면 1분 흐른 뒤 2분 남는다', () => {
    expect(remainingAfter(MINUTE_IN_MS, 3 * MINUTE_IN_MS)).toBe(2 * MINUTE_IN_MS);
  });

  it.each([
    { elapsedMs: 25 * MINUTE_IN_MS - 1, expected: 1 },
    { elapsedMs: 25 * MINUTE_IN_MS, expected: 0 },
    { elapsedMs: 25 * MINUTE_IN_MS + 1, expected: 0 },
  ])('$elapsedMs밀리초 흐르면 $expected밀리초 남는다', ({ elapsedMs, expected }) => {
    expect(remainingAfter(elapsedMs)).toBe(expected);
  });

  it('25분 타이머가 60분 지나도 0이다', () => {
    expect(remainingAfter(60 * MINUTE_IN_MS)).toBe(0);
  });
});

describe('복구한 단계의 남은 시간(밀리초)', () => {
  it('대기 상태는 남은 시간이 없다', () => {
    expect(sessionRemainingMs({ session: READY_SESSION, now: NOW })).toBeNull();
  });

  it('진행 상태는 끝날 시각까지 남은 시간이다', () => {
    expect(sessionRemainingMs({ session: { phase: 'running', mode: 'focus', startedAt: NOW - 22 * MINUTE_IN_MS, endsAt: NOW + 3 * MINUTE_IN_MS }, now: NOW })).toBe(
      3 * MINUTE_IN_MS,
    );
  });

  it('끝날 시각이 지난 진행 상태는 0이다', () => {
    expect(sessionRemainingMs({ session: { phase: 'running', mode: 'focus', startedAt: NOW - 25 * MINUTE_IN_MS, endsAt: NOW - 1 }, now: NOW })).toBe(0);
  });

  it('일시정지 상태는 멈춘 시점에 남아 있던 시간이다', () => {
    expect(sessionRemainingMs({ session: { phase: 'paused', mode: 'focus', startedAt: NOW - 23.5 * MINUTE_IN_MS, pausedRemainingMs: 90_000 }, now: NOW })).toBe(90_000);
  });

  it('완료 상태는 0이다', () => {
    expect(sessionRemainingMs({ session: { phase: 'completed', mode: 'rest', completedAt: NOW }, now: NOW })).toBe(0);
  });
});
