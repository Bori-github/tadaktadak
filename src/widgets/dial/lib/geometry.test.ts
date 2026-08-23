import { describe, expect, it } from '@jest/globals';

import { isOnHandle, minutesFromPoint, pointOnDial } from './geometry';

import { TIMER_RANGE } from '@/entities/timer';

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

describe('터치한 곳이 손잡이를 잡는 범위 안에 있는지 여부', () => {
  /** 도트 2픽셀에서 손잡이 중심 11 도트는 22픽셀. `DESIGN.md` §4 */
  const grabbed = (x: number, y: number) => isOnHandle({ handleX: CENTER_X, handleY: CENTER_Y, x, y, dotSize: 2 });

  it('옆으로 22픽셀은 손잡이를 잡는 범위 안에 있다', () => {
    expect(grabbed(122, 100)).toBe(true);
  });

  it('옆으로 23픽셀은 손잡이를 잡는 범위 안에 없다', () => {
    expect(grabbed(123, 100)).toBe(false);
  });

  it('대각선으로 16픽셀씩은 22.6픽셀이라 손잡이를 잡는 범위 안에 없다', () => {
    expect(grabbed(116, 116)).toBe(false);
  });
});
