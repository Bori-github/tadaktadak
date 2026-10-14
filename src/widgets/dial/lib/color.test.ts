import { describe, expect, it } from '@jest/globals';

import { colorMode } from './color';

import { type TimerMode } from '@/entities/timer';

const CASES: { situation: string; editing: boolean; editTarget: TimerMode; expected: TimerMode; modeName: string }[] = [
  { situation: '집중 타이머를 설정하는 중', editing: true, editTarget: 'focus', expected: 'focus', modeName: '집중' },
  { situation: '휴식 타이머를 설정하는 중', editing: true, editTarget: 'rest', expected: 'rest', modeName: '휴식' },
  { situation: '집중 타이머 진행', editing: false, editTarget: 'focus', expected: 'focus', modeName: '집중' },
  { situation: '휴식 타이머 진행', editing: false, editTarget: 'rest', expected: 'focus', modeName: '집중' },
];

describe('호와 손잡이 색을 결정하는 타이머 모드', () => {
  it.each(CASES)('$situation에는 $modeName 타이머 색이다', ({ editing, editTarget, expected }) => {
    expect(colorMode({ editing, editTarget })).toBe(expected);
  });
});
