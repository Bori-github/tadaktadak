import { describe, expect, it } from '@jest/globals';

import { millisecondsToSeconds } from './seconds';

describe('밀리초를 초로 변환', () => {
  it.each([
    { ms: 0, expected: 0 },
    { ms: 1, expected: 1 },
    { ms: 999, expected: 1 },
    { ms: 1000, expected: 1 },
    { ms: 1001, expected: 2 },
    { ms: 1_500_000, expected: 1500 },
    { ms: -1, expected: 0 },
    { ms: -300_000, expected: 0 },
  ])('$ms밀리초는 $expected초다', ({ ms, expected }) => {
    expect(millisecondsToSeconds(ms)).toBe(expected);
  });
});
