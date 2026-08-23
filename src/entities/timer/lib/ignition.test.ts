import { describe, expect, it } from '@jest/globals';

import { ignitionProgress } from './ignition';

const ignitionAt = (slot: number, remainingMinutes: number, settingMinutes = 25) => ignitionProgress({ slot, remainingMinutes, settingMinutes });

describe('점화 판정', () => {
  it('남은 3분일 때 5번 칸은 완전히 붙었다', () => {
    expect(ignitionAt(5, 3)).toBe(1);
  });

  it('남은 4.25분일 때 5번 칸은 0.75만큼 차올랐다', () => {
    expect(ignitionAt(5, 4.25)).toBe(0.75);
  });

  it('남은 6분일 때 5번 칸은 아직 붙지 않았다', () => {
    expect(ignitionAt(5, 6)).toBe(0);
  });

  it.each([
    [4, 1],
    [4.5, 0.5],
    [5, 0],
  ])('남은 %s분일 때 5번 칸 진행률은 %s이다', (remainingMinutes, expected) => {
    expect(ignitionAt(5, remainingMinutes)).toBe(expected);
  });

  it('설정 25분일 때 26번 칸은 다 타도 붙지 않는다', () => {
    expect(ignitionAt(26, 0)).toBe(0);
  });

  it('설정 25분일 때 25번 칸은 다 타면 붙는다', () => {
    expect(ignitionAt(25, 0)).toBe(1);
  });
});
