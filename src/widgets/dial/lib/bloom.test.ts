import { describe, expect, it } from '@jest/globals';

import { bloomRadius, CENTER_BLOOM_ALPHA } from './bloom';

/** 기준 화면 배율 1의 도트 한 변 */
const DOT = 2;

const radius = (tick: number, isMajorTick: boolean, progress = 1, dotSize = DOT) => bloomRadius({ tick, isMajorTick, progress, step: 0, dotSize });

describe('빛 번짐 반지름', () => {
  it('다 붙은 모닥불은 32, 장작은 16이다', () => {
    expect([radius(1, true), radius(1, false)]).toEqual([32, 16]);
  });

  it.each([
    [3, 28.8],
    [1, 32],
    [2, 35.2],
  ])('눈금 %i에서 깜빡임이 %s로 간다', (tick, expected) => {
    expect(radius(tick, true)).toBeCloseTo(expected, 10);
  });

  it('절반만 붙은 모닥불은 24.8이다', () => {
    expect(radius(1, true, 0.5)).toBeCloseTo(24.8, 10);
  });

  it('배율 3에서 모닥불은 96이다', () => {
    expect(radius(1, true, 1, 6)).toBe(96);
  });
});

describe('가운데 빛 번짐 알파', () => {
  it('0.24다', () => {
    expect(CENTER_BLOOM_ALPHA).toBe(0.24);
  });
});
