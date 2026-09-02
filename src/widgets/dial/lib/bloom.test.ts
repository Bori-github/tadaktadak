import { describe, expect, it } from '@jest/globals';

import { bloomRadius, centerBloomAlpha } from './bloom';

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

describe('중앙 빛 번짐 알파', () => {
  it.each([
    [0, 0.04],
    [25, 0.165],
    [60, 0.34],
  ])('다 붙은 눈금 %i칸에서 %s다', (litCount, expected) => {
    expect(centerBloomAlpha(litCount)).toBeCloseTo(expected, 10);
  });
});
