import { describe, expect, it } from '@jest/globals';

import { parseMinutes, parseSession } from './parse';
import { type TimerSession } from './session';
import { TIMER_DEFAULT } from '../config/minutes';

const running: TimerSession = { phase: 'running', mode: 'focus', endsAt: 1_700_000_000_000, pausedRemainingMs: null };

describe('저장된 타이머 세션 값 읽기', () => {
  it('저장한 대로 돌아온다', () => {
    expect(parseSession(JSON.stringify(running))).toEqual(running);
  });

  it.each([
    ['저장값이 없으면', null],
    ['JSON이 아니면', '{'],
    ['단계가 넷 중 하나가 아니면', '{"phase":"burning","mode":"focus","endsAt":1,"pausedRemainingMs":null}'],
    ['모드가 둘 중 하나가 아니면', '{"phase":"running","mode":"sleep","endsAt":1,"pausedRemainingMs":null}'],
    ['진행인데 끝날 시각이 없으면', '{"phase":"running","mode":"focus","endsAt":null,"pausedRemainingMs":null}'],
    ['일시정지인데 남은 밀리초가 없으면', '{"phase":"paused","mode":"focus","endsAt":null,"pausedRemainingMs":null}'],
  ])('%s 버린다', (_label, raw) => {
    expect(parseSession(raw)).toBeNull();
  });
});

describe('저장된 타이머 시간 읽기', () => {
  it('저장한 분이 범위 안이면 그대로 쓴다', () => {
    expect(parseMinutes('40', 'focus')).toBe(40);
  });

  it('휴식 타이머는 0분을 받는다', () => {
    expect(parseMinutes('0', 'rest')).toBe(0);
  });

  it.each([
    ['저장값이 없으면', null],
    ['숫자가 아니면', '스물다섯'],
    ['하한보다 작으면', '0'],
    ['상한보다 크면', '61'],
    ['정수가 아니면', '25.5'],
  ])('집중 타이머는 %s 기본값을 쓴다', (_label, raw) => {
    expect(parseMinutes(raw, 'focus')).toBe(TIMER_DEFAULT.focus);
  });
});
