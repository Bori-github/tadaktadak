import { describe, expect, it } from '@jest/globals';

import { parseSession } from './parse';
import { serializeSession } from './serialize';
import { READY_SESSION, type TimerSession } from './session';
import { MINUTE_IN_MS } from '../config/minutes';
import { NOW } from '../lib/fixtures';

const stored = (session: TimerSession): unknown => JSON.parse(serializeSession(session) ?? 'null');

describe('기기에 저장할 타이머 세션 값 문자열', () => {
  it('진행 상태는 시작한 시각과 끝날 시각을 담는다', () => {
    expect(stored({ phase: 'running', mode: 'focus', startedAt: NOW, endsAt: NOW + 25 * MINUTE_IN_MS })).toEqual({
      phase: 'running',
      mode: 'focus',
      startedAt: NOW,
      endsAt: NOW + 25 * MINUTE_IN_MS,
    });
  });

  it('일시정지 상태는 끝날 시각 대신 남은 밀리초를 담는다', () => {
    expect(stored({ phase: 'paused', mode: 'focus', startedAt: NOW - 23.5 * MINUTE_IN_MS, pausedRemainingMs: 90_000 })).toEqual({
      phase: 'paused',
      mode: 'focus',
      startedAt: NOW - 23.5 * MINUTE_IN_MS,
      pausedRemainingMs: 90_000,
    });
  });

  it('집중 타이머가 완료된 경우 단계와 모드만 담는다', () => {
    expect(stored({ phase: 'completed', mode: 'focus' })).toEqual({ phase: 'completed', mode: 'focus' });
  });

  it('대기 상태는 저장할 문자열이 없다', () => {
    expect(serializeSession(READY_SESSION)).toBeNull();
  });
});

describe('저장한 문자열을 다시 읽기', () => {
  it.each<{ label: string; session: TimerSession }>([
    { label: '진행 상태', session: { phase: 'running', mode: 'focus', startedAt: NOW, endsAt: NOW + 25 * MINUTE_IN_MS } },
    { label: '일시정지 상태', session: { phase: 'paused', mode: 'rest', startedAt: NOW - 3.5 * MINUTE_IN_MS, pausedRemainingMs: 90_000 } },
    { label: '완료 상태', session: { phase: 'completed', mode: 'focus' } },
  ])('$label는 저장한 값 그대로 돌아온다', ({ session }) => {
    expect(parseSession(serializeSession(session))).toEqual(session);
  });
});
