import { describe, expect, it } from '@jest/globals';

import { millisecondsToMinutes } from './minutes';

describe('밀리초를 분으로 변환', () => {
  it.each([
    { ms: 0, expected: 0 },
    { ms: 30_000, expected: 0.5 },
    { ms: 59_940, expected: 0.999 },
    { ms: 60_000, expected: 1 },
    { ms: 1_500_000, expected: 25 },
    { ms: -1, expected: 0 },
    { ms: -300_000, expected: 0 },
  ])('$ms밀리초는 $expected분이다', ({ ms, expected }) => {
    expect(millisecondsToMinutes(ms)).toBeCloseTo(expected, 10);
  });
});
