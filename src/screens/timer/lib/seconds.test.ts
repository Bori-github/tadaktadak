import { describe, expect, it } from '@jest/globals';

import { millisecondsToSeconds } from './seconds';

describe('밀리초를 초로 변환', () => {
  it.each([
    { label: '시간 없음', ms: 0, expected: 0 },
    { label: '가장 작은 양수', ms: 1, expected: 1 },
    { label: '1초 직전', ms: 999, expected: 1 },
    { label: '1초', ms: 1000, expected: 1 },
    { label: '1초 직후', ms: 1001, expected: 2 },
    { label: '기본 집중 타이머 시간', ms: 1_500_000, expected: 1500 },
    { label: '음수', ms: -1, expected: 0 },
    { label: '5분만큼 음수', ms: -300_000, expected: 0 },
  ])('$label: $ms밀리초는 $expected초다', ({ ms, expected }) => {
    expect(millisecondsToSeconds(ms)).toBe(expected);
  });
});
