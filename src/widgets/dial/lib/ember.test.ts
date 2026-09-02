import { describe, expect, it } from '@jest/globals';

import { EMBER_COLORS, EMBER_COUNT, emberAt, emberColorIndex, spawnEmbers, type Ember } from './ember';

import { COLORS } from '@/shared/constants';

const embers = (random?: () => number) => spawnEmbers({ centerX: 100, centerY: 100, radius: 76.5, random });

/** 12시에서 초당 한 도트로 곧게 오르는 불티. 수명은 2.8초 */
const rising: Ember = { x: 0, y: 0, velocityX: 0, velocityY: -1, lifeMs: 2800 };

describe('불티 생성', () => {
  it('80개를 만든다', () => {
    expect(embers()).toHaveLength(EMBER_COUNT);
  });

  it.each([
    { label: '가장 짧은', value: 0, expected: 2100 },
    { label: '가장 긴', value: 1, expected: 3500 },
  ])('$label 수명은 $expected밀리초다', ({ value, expected }) => {
    expect(embers(() => value)[0]?.lifeMs).toBeCloseTo(expected, 10);
  });

  it.each([
    { label: '가장 느린', value: 0, expected: -0.33 },
    { label: '가장 빠른', value: 1, expected: -0.87 },
  ])('$label 상승 속도는 $expected 도트/프레임이다', ({ value, expected }) => {
    expect(embers(() => value)[0]?.velocityY).toBeCloseTo(expected, 10);
  });

  it.each([
    { label: '왼쪽 끝', value: 0, expected: -0.12 },
    { label: '오른쪽 끝', value: 1, expected: 0.32 },
  ])('3시 방향 불티의 $label 가로 속도는 $expected 도트/프레임이다', ({ value, expected }) => {
    expect(embers(() => value)[0]?.velocityX).toBeCloseTo(expected, 10);
  });

  it.each([
    { label: '가장 안쪽', value: 0, expected: 165.79 },
    { label: '가장 바깥', value: 1, expected: 179.56 },
  ])('$label 불티는 개체 반지름 76.5인 시계판에서 x $expected에 나온다', ({ value, expected }) => {
    expect(embers(() => value)[0]?.x).toBeCloseTo(expected, 10);
  });
});

describe('불티 위치', () => {
  it('첫 프레임에는 속도만큼 간다', () => {
    expect(emberAt(rising, 16).y).toBeCloseTo(-1, 10);
  });

  it('두 번째 프레임에는 세로 속도가 0.994로 줄어 1.994까지 간다', () => {
    expect(emberAt(rising, 32).y).toBeCloseTo(-1.994, 10);
  });

  it('가로 속도는 0.985로 더 빨리 줄어든다', () => {
    expect(emberAt({ ...rising, velocityX: 1, velocityY: 0 }, 32).x).toBeCloseTo(1.985, 10);
  });
});

describe('불티 수명', () => {
  it.each([
    [0, 1],
    [1400, 0.5],
    [2800, 0],
    [3200, 0],
  ])('노출 후 %i밀리초에 남은 수명은 %s다', (elapsedMs, expected) => {
    expect(emberAt(rising, elapsedMs).life).toBeCloseTo(expected, 10);
  });
});

describe('불티 색', () => {
  it.each([
    [1, COLORS.fire.core],
    [0.67, COLORS.fire.core],
    [0.66, COLORS.fire.mid],
    [0.34, COLORS.fire.mid],
    [0.33, COLORS.fire.base],
    [0, COLORS.fire.base],
  ])('남은 수명 %s일 때 %s다', (life, expected) => {
    expect(EMBER_COLORS[emberColorIndex(life)]).toBe(expected);
  });
});
