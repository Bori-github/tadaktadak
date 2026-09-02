import { describe, expect, it } from '@jest/globals';

import { isThumbTwinkling, thumbGrid } from './twinkle';

import { type TimerPhase } from '@/entities/timer';
import { SPARK_A, SPARK_B, SPARK_REST } from '@/shared/ui/dot-sprite';

describe('손잡이가 반짝이는 단계', () => {
  it.each([
    { label: '집중 타이머 진행', isResting: false, phase: 'running', expected: true },
    { label: '집중 타이머 대기', isResting: false, phase: 'ready', expected: false },
    { label: '집중 타이머 완료', isResting: false, phase: 'completed', expected: false },
    { label: '휴식 타이머 진행', isResting: true, phase: 'running', expected: false },
    { label: '일시정지', isResting: false, phase: 'paused', expected: false },
  ] as { label: string; isResting: boolean; phase: TimerPhase; expected: boolean }[])('$label에서 $expected다', ({ isResting, phase, expected }) => {
    expect(isThumbTwinkling({ isResting, phase })).toBe(expected);
  });
});

describe('손잡이 반짝임 프레임', () => {
  it.each([
    [0, SPARK_A],
    [1, SPARK_B],
    [2, SPARK_A],
  ])('반짝이는 동안 %i번째 프레임은 A와 B를 번갈아 그린다', (step, expected) => {
    expect(thumbGrid({ mode: 'focus', isTwinkling: true, step })).toBe(expected);
  });

  it('반짝이지 않으면 B 차례에도 A에 고정한다', () => {
    expect(thumbGrid({ mode: 'focus', isTwinkling: false, step: 1 })).toBe(SPARK_A);
  });

  it('휴식 타이머를 설정하는 중에는 반짝이지 않는다', () => {
    expect(thumbGrid({ mode: 'rest', isTwinkling: true, step: 1 })).toBe(SPARK_REST);
  });
});
