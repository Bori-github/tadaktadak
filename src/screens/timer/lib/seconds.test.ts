import { describe, expect, it } from '@jest/globals';

import { millisecondsToSeconds } from './seconds';

describe('밀리초를 초로 변환', () => {
  it.each([
    [0, 0],
    [1, 1],
    [999, 1],
    [1000, 1],
    [1001, 2],
    [1_500_000, 1500],
  ])('%i밀리초는 %i초다', (ms, expected) => {
    expect(millisecondsToSeconds(ms)).toBe(expected);
  });
});
