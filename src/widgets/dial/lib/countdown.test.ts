import { describe, expect, it } from '@jest/globals';

import { countdownSeconds, restStartCountdownCenterY } from './countdown';

const seconds = (mode: 'focus' | 'rest', active: 'focus' | 'rest', remainingSeconds: number | null) =>
  countdownSeconds({ mode, active, minutes: mode === 'focus' ? 25 : 5, remainingSeconds });

describe('시계판 숫자 한 줄', () => {
  it('대기에서는 두 줄 다 설정 시간이다', () => {
    expect([seconds('focus', 'focus', null), seconds('rest', 'focus', null)]).toEqual([1500, 300]);
  });

  it('집중을 세는 동안 집중 줄만 남은 시간을 보여 준다', () => {
    expect([seconds('focus', 'focus', 90), seconds('rest', 'focus', 90)]).toEqual([90, 300]);
  });

  it('휴식을 세는 동안 휴식 줄만 남은 시간을 보여 준다', () => {
    expect([seconds('focus', 'rest', 90), seconds('rest', 'rest', 90)]).toEqual([1500, 90]);
  });
});

describe('휴식 시작 전 카운트다운 자리', () => {
  it.each([
    [2, 199],
    [6, 171],
  ])('도트 %i에서 중심이 %i다', (dotSize, expected) => {
    expect(restStartCountdownCenterY({ centerY: 400, numeralRadius: 175, dotSize })).toBe(expected);
  });
});
