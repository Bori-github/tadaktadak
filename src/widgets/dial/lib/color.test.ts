import { describe, expect, it } from '@jest/globals';

import { colorMode } from './color';

import { type TimerMode } from '@/entities/timer';

const CASES: { situation: string; editing: boolean; editTarget: TimerMode; expected: TimerMode }[] = [
  { situation: '집중 타이머를 설정하는 중', editing: true, editTarget: 'focus', expected: 'focus' },
  { situation: '휴식 타이머를 설정하는 중', editing: true, editTarget: 'rest', expected: 'rest' },
  { situation: '집중 타이머 진행', editing: false, editTarget: 'focus', expected: 'focus' },
  { situation: '휴식 타이머 진행', editing: false, editTarget: 'rest', expected: 'focus' },
];

describe('호와 손잡이를 그릴 색', () => {
  it.each(CASES)('$situation에는 $expected 색이다', ({ editing, editTarget, expected }) => {
    expect(colorMode({ editing, editTarget })).toBe(expected);
  });
});
