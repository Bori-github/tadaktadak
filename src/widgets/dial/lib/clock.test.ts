import { describe, expect, it } from '@jest/globals';

import { formatSecondsToClock } from './clock';

describe('시계판 숫자', () => {
  it.each([
    { totalSeconds: 0, expected: '00:00' },
    { totalSeconds: 59, expected: '00:59' },
    { totalSeconds: 60, expected: '01:00' },
    { totalSeconds: 61, expected: '01:01' },
    { totalSeconds: 1500, expected: '25:00' },
    { totalSeconds: 3600, expected: '60:00' },
  ])('$totalSeconds초는 $expected다', ({ totalSeconds, expected }) => {
    expect(formatSecondsToClock(totalSeconds)).toBe(expected);
  });
});
