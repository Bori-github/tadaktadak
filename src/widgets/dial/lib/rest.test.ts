import { describe, expect, it } from '@jest/globals';

import { restDialMinutes } from './rest';

const minutes = (remainingMinutes: number, restMinutes = 5) => restDialMinutes({ focusMinutes: 25, restMinutes, remainingMinutes });

describe('휴식 진행 중 호가 가리킬 분', () => {
  it.each([
    { label: '휴식 시작', remainingMinutes: 5, expected: 0 },
    { label: '휴식 절반', remainingMinutes: 2.5, expected: 12.5 },
    { label: '휴식 끝', remainingMinutes: 0, expected: 25 },
  ])('$label: 휴식 $remainingMinutes분이 남으면 $expected분을 가리킨다', ({ remainingMinutes, expected }) => {
    expect(minutes(remainingMinutes)).toBe(expected);
  });

  it('휴식 타이머가 0분이면 0을 가리킨다', () => {
    expect(minutes(0, 0)).toBe(0);
  });
});
