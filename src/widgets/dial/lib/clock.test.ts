import { describe, expect, it } from '@jest/globals';

import { formatSecondsToClock } from './clock';

describe('시계판 숫자', () => {
  it.each([
    [0, '00:00'],
    [59, '00:59'],
    [60, '01:00'],
    [61, '01:01'],
    [1500, '25:00'],
    [3600, '60:00'],
  ])('%i초는 %s다', (totalSeconds, expected) => {
    expect(formatSecondsToClock(totalSeconds)).toBe(expected);
  });
});
