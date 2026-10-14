import { describe, expect, it } from '@jest/globals';

import { isWithinThumb, minutesFromPoint, pointOnDial } from './geometry';

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
    { label: '12시', degrees: 0, x: 100, y: 50 },
    { label: '3시', degrees: 90, x: 150, y: 100 },
    { label: '6시', degrees: 180, x: 100, y: 150 },
    { label: '9시', degrees: 270, x: 50, y: 100 },
  ])('$label 방향 $degrees도는 ($x, $y)다', ({ degrees, x, y }) => {
    const point = pointOnDial(CENTER_X, CENTER_Y, RADIUS, degrees);
    expect(point.x).toBeCloseTo(x);
    expect(point.y).toBeCloseTo(y);
  });
});

describe('네 방향', () => {
  it.each([
    { label: '12시', x: 100, y: 50, minutes: 0 },
    { label: '3시', x: 150, y: 100, minutes: 15 },
    { label: '6시', x: 100, y: 150, minutes: 30 },
    { label: '9시', x: 50, y: 100, minutes: 45 },
  ])('$label 방향 ($x, $y)는 $minutes분이다', ({ x, y, minutes }) => {
    expect(minutesAt(x, y, minutes, REST)).toBe(minutes);
  });
});

describe('1분 스냅', () => {
  it.each([
    { label: '1분 경계 직전', degrees: 2.9, minutes: 0 },
    { label: '1분 경계', degrees: 3, minutes: 1 },
    { label: '2분 경계 직전', degrees: 8.9, minutes: 1 },
    { label: '2분 경계', degrees: 9, minutes: 2 },
  ])('$label: $degrees도는 $minutes분이다', ({ degrees, minutes }) => {
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
    { label: '직전 값이 절반 이하', previous: 30, minutes: 0 },
    { label: '직전 값이 절반 초과', previous: 31, minutes: 60 },
  ])('$label: 직전 값이 $previous분이면 12시는 $minutes분이다', ({ previous, minutes }) => {
    expect(minutesAt(100, 50, previous, REST)).toBe(minutes);
  });
});

describe('터치한 곳이 손잡이를 잡는 범위 안에 있는지 여부', () => {
  /** 도트 2픽셀에서 손잡이 중심 11 도트는 22픽셀. `DESIGN.md` §4 */
  const grabbed = (x: number, y: number) => isWithinThumb({ thumbX: CENTER_X, thumbY: CENTER_Y, x, y, dotSize: 2 });

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
