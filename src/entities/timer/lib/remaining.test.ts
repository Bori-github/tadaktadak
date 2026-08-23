import { describe, expect, it } from '@jest/globals';

import { remainingMs } from './remaining';

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
