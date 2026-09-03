import { describe, expect, it } from '@jest/globals';

import { parseMinutes, parseSession } from './parse';
import { type RunningSession } from './session';
import { MINUTE_IN_MS, TIMER_DEFAULT } from '../config/minutes';
import { NOW } from '../lib/fixtures';

const running: RunningSession = { phase: 'running', mode: 'focus', startedAt: NOW - 22 * MINUTE_IN_MS, endsAt: NOW + 3 * MINUTE_IN_MS };

describe('저장된 타이머 세션 값 읽기', () => {
  it('저장한 대로 돌아온다', () => {
    expect(parseSession(JSON.stringify(running))).toEqual(running);
  });

  it.each([
    { label: '저장값이 없으면', raw: null },
    { label: 'JSON이 아니면', raw: '{' },
    { label: '단계가 넷 중 하나가 아니면', raw: `{"phase":"burning","mode":"focus","endsAt":${NOW},"pausedRemainingMs":null}` },
    { label: '모드가 둘 중 하나가 아니면', raw: `{"phase":"running","mode":"sleep","endsAt":${NOW},"pausedRemainingMs":null}` },
    { label: '진행인데 끝날 시각이 없으면', raw: `{"phase":"running","mode":"focus","startedAt":${NOW},"endsAt":null,"pausedRemainingMs":null}` },
    { label: '일시정지인데 남은 밀리초가 없으면', raw: `{"phase":"paused","mode":"focus","startedAt":${NOW},"endsAt":null,"pausedRemainingMs":null}` },
    { label: '진행인데 시작한 시각이 없으면', raw: `{"phase":"running","mode":"focus","startedAt":null,"endsAt":${NOW},"pausedRemainingMs":null}` },
    { label: '일시정지인데 시작한 시각이 없으면', raw: '{"phase":"paused","mode":"focus","startedAt":null,"endsAt":null,"pausedRemainingMs":90000}' },
  ])('$label 버린다', ({ raw }) => {
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

  it('휴식 타이머도 빈 문자열이면 기본값을 쓴다', () => {
    expect(parseMinutes('', 'rest')).toBe(TIMER_DEFAULT.rest);
  });

  it.each([
    { label: '저장값이 없으면', raw: null },
    { label: '숫자가 아니면', raw: '스물다섯' },
    { label: '하한보다 작으면', raw: '0' },
    { label: '상한보다 크면', raw: '61' },
    { label: '정수가 아니면', raw: '25.5' },
    { label: '빈 문자열이면', raw: '' },
    { label: '앞뒤에 공백이 있으면', raw: ' 25 ' },
    { label: '16진수 표기면', raw: '0x10' },
    { label: '지수 표기면', raw: '1e1' },
  ])('집중 타이머는 $label 기본값을 쓴다', ({ raw }) => {
    expect(parseMinutes(raw, 'focus')).toBe(TIMER_DEFAULT.focus);
  });
});
