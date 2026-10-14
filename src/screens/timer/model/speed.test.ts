import { describe, expect, it } from '@jest/globals';

import { realMinutes, toShownMinutes, toShownSeconds } from './speed';

describe('배속을 걸었을 때 실제로 흐를 설정 시간(분)', () => {
  it.each([
    { label: '1배속', speed: 1, expected: { focus: 25, rest: 5 } },
    { label: '5배속', speed: 5, expected: { focus: 5, rest: 1 } },
    { label: '10배속', speed: 10, expected: { focus: 2.5, rest: 0.5 } },
    { label: '50배속', speed: 50, expected: { focus: 0.5, rest: 0.1 } },
  ])('집중 25분과 휴식 5분은 $label에서 집중 $expected.focus분, 휴식 $expected.rest분만큼 흐른다', ({ speed, expected }) => {
    expect(realMinutes({ focus: 25, rest: 5 }, speed)).toEqual(expected);
  });
});

describe('남은 실제 시간이 배속에서 보일 초', () => {
  it.each([
    { label: '1배속', realMs: 150_000, speed: 1, expected: 150 },
    { label: '10배속', realMs: 150_000, speed: 10, expected: 1500 },
    { label: '50배속', realMs: 30_000, speed: 50, expected: 1500 },
  ])('남은 $realMs밀리초는 $label에서 $expected초로 보인다', ({ realMs, speed, expected }) => {
    expect(toShownSeconds(realMs, speed)).toBe(expected);
  });
});

describe('남은 실제 시간이 배속에서 보일 분', () => {
  it.each([
    { label: '1배속', realMs: 30_000, speed: 1, expected: 0.5 },
    { label: '10배속', realMs: 30_000, speed: 10, expected: 5 },
    { label: '50배속', realMs: 30_000, speed: 50, expected: 25 },
  ])('남은 $realMs밀리초는 $label에서 $expected분으로 보인다', ({ realMs, speed, expected }) => {
    expect(toShownMinutes(realMs, speed)).toBeCloseTo(expected, 10);
  });
});
