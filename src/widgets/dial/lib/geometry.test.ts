import { describe, expect, it } from '@jest/globals';

import { minutesFromPoint, pointOnDial } from './geometry';

import { TIMER_RANGE } from '@/shared/constants';

const CENTER_X = 100;
const CENTER_Y = 100;
const RADIUS = 50;

const { focus: FOCUS, rest: REST } = TIMER_RANGE;

const minutesAt = (x: number, y: number, previous: number, range: (typeof TIMER_RANGE)[keyof typeof TIMER_RANGE]) =>
  minutesFromPoint({ centerX: CENTER_X, centerY: CENTER_Y, x, y, previous, ...range });

const minutesAtDegrees = (degrees: number, previous: number, range: (typeof TIMER_RANGE)[keyof typeof TIMER_RANGE]) => {
  const { x, y } = pointOnDial(CENTER_X, CENTER_Y, RADIUS, degrees);
  return minutesAt(x, y, previous, range);
};

describe('시계판 위 한 점', () => {
  it.each([
    [0, 100, 50],
    [90, 150, 100],
    [180, 100, 150],
    [270, 50, 100],
  ])('%i도는 (%i, %i)다', (degrees, x, y) => {
    const point = pointOnDial(CENTER_X, CENTER_Y, RADIUS, degrees);
    expect(point.x).toBeCloseTo(x);
    expect(point.y).toBeCloseTo(y);
  });
});

describe('네 방향', () => {
  it.each([
    [100, 50, 0],
    [150, 100, 15],
    [100, 150, 30],
    [50, 100, 45],
  ])('(%i, %i)는 %i분이다', (x, y, minutes) => {
    expect(minutesAt(x, y, minutes, REST)).toBe(minutes);
  });
});

describe('1분 스냅', () => {
  it.each([
    [2.9, 0],
    [3, 1],
    [8.9, 1],
    [9, 2],
  ])('%s도는 %i분이다', (degrees, minutes) => {
    expect(minutesAtDegrees(degrees, 1, REST)).toBe(minutes);
  });
});

describe('범위', () => {
  it('집중은 12시에서 최솟값 1분이다', () => {
    expect(minutesAt(100, 50, 1, FOCUS)).toBe(1);
  });

  it('휴식은 12시에서 0분이다', () => {
    expect(minutesAt(100, 50, 0, REST)).toBe(0);
  });
});

describe('12시 경계', () => {
  it('60분 가까이에서 12시를 넘겨도 60분에 멈춘다', () => {
    expect(minutesAtDegrees(2, 55, REST)).toBe(60);
  });

  it('0분 가까이에서 12시를 넘겨도 최솟값에 멈춘다', () => {
    expect(minutesAtDegrees(358, 5, FOCUS)).toBe(1);
    expect(minutesAtDegrees(358, 5, REST)).toBe(0);
  });

  it.each([
    [30, 0],
    [31, 60],
  ])('직전 값이 %i분이면 12시는 %i분이다', (previous, minutes) => {
    expect(minutesAt(100, 50, previous, REST)).toBe(minutes);
  });
});
