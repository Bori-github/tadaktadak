import { describe, expect, it } from '@jest/globals';

import { formatSecondsToClock } from './clock';

describe('시계판 숫자', () => {
  it.each([
    { label: '시간 없음', totalSeconds: 0, expected: '00:00' },
    { label: '1분 직전', totalSeconds: 59, expected: '00:59' },
    { label: '1분', totalSeconds: 60, expected: '01:00' },
    { label: '1분 직후', totalSeconds: 61, expected: '01:01' },
    { label: '기본 집중 타이머 시간', totalSeconds: 1500, expected: '25:00' },
    { label: '최대 타이머 시간', totalSeconds: 3600, expected: '60:00' },
  ])('$label: $totalSeconds초는 $expected다', ({ totalSeconds, expected }) => {
    expect(formatSecondsToClock(totalSeconds)).toBe(expected);
  });
});
