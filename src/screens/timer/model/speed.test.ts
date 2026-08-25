import { describe, expect, it } from '@jest/globals';

import { realMinutes, toShownSeconds } from './speed';

describe('배속을 걸었을 때 실제로 흐를 설정 시간', () => {
  it.each([
    { speed: 1, expected: { focus: 25, rest: 5 } },
    { speed: 5, expected: { focus: 5, rest: 1 } },
    { speed: 10, expected: { focus: 2.5, rest: 0.5 } },
    { speed: 50, expected: { focus: 0.5, rest: 0.1 } },
  ])('집중 25분과 휴식 5분은 $speed배속에서 집중 $expected.focus분, 휴식 $expected.rest분만큼 흐른다', ({ speed, expected }) => {
    expect(realMinutes({ focus: 25, rest: 5 }, speed)).toEqual(expected);
  });
});

describe('배속에서 보여 줄 초', () => {
  it.each([
    { realMs: 150_000, speed: 1, expected: 150 },
    { realMs: 150_000, speed: 10, expected: 1500 },
    { realMs: 30_000, speed: 50, expected: 1500 },
  ])('남은 $realMs밀리초는 $speed배속에서 $expected초로 보인다', ({ realMs, speed, expected }) => {
    expect(toShownSeconds(realMs, speed)).toBe(expected);
  });
});
