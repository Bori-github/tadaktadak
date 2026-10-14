import { describe, expect, it } from '@jest/globals';

import { millisecondsToMinutes } from './minutes';

describe('밀리초를 분으로 변환', () => {
  it.each([
    { label: '시간 없음', ms: 0, expected: 0 },
    { label: '30초', ms: 30_000, expected: 0.5 },
    { label: '1분 직전', ms: 59_940, expected: 0.999 },
    { label: '1분', ms: 60_000, expected: 1 },
    { label: '기본 집중 타이머 시간', ms: 1_500_000, expected: 25 },
    { label: '음수', ms: -1, expected: 0 },
    { label: '5분만큼 음수', ms: -300_000, expected: 0 },
  ])('$label: $ms밀리초는 $expected분이다', ({ ms, expected }) => {
    expect(millisecondsToMinutes(ms)).toBeCloseTo(expected, 10);
  });
});
