import { describe, expect, it } from '@jest/globals';

import { restDialMinutes } from './rest';

const minutes = (remainingMinutes: number, restMinutes = 5) => restDialMinutes({ focusMinutes: 25, restMinutes, remainingMinutes });

describe('휴식 진행 중 호가 가리킬 분', () => {
  it.each([
    [5, 0],
    [2.5, 12.5],
    [0, 25],
  ])('휴식 %s분이 남으면 %s분을 가리킨다', (remainingMinutes, expected) => {
    expect(minutes(remainingMinutes)).toBe(expected);
  });

  it('휴식 타이머가 0분이면 0을 가리킨다', () => {
    expect(minutes(0, 0)).toBe(0);
  });
});
