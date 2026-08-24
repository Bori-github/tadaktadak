import { describe, expect, it } from '@jest/globals';

import { realMinutes, toShownSeconds } from './speed';

describe('배속을 걸었을 때 실제로 흐를 설정 시간', () => {
  it.each([
    [1, { focus: 25, rest: 5 }],
    [5, { focus: 5, rest: 1 }],
    [10, { focus: 2.5, rest: 0.5 }],
    [50, { focus: 0.5, rest: 0.1 }],
  ])('집중 25분과 휴식 5분은 %i배속에서 %o만큼 흐른다', (speed, expected) => {
    expect(realMinutes({ focus: 25, rest: 5 }, speed)).toEqual(expected);
  });
});

describe('배속에서 보여 줄 초', () => {
  it.each([
    [150_000, 1, 150],
    [150_000, 10, 1500],
    [30_000, 50, 1500],
  ])('남은 %i밀리초는 %i배속에서 %i초로 보인다', (realMs, speed, expected) => {
    expect(toShownSeconds(realMs, speed)).toBe(expected);
  });
});
