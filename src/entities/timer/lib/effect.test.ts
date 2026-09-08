import { describe, expect, it } from '@jest/globals';

import { completedEffectRemainingMs, completedEffectStartedAt } from './effect';
import { NOW } from './fixtures';
import { MINUTE_IN_MS } from '../config/minutes';
import { pauseTimer, resumeTimer } from '../model/transition';
import { READY_SESSION, type CompletedSession, type RunningSession, type TimerSession } from '../model/session';

const REST_MS = 5 * MINUTE_IN_MS;

const resting: RunningSession = { phase: 'running', mode: 'rest', startedAt: NOW, endsAt: NOW + REST_MS };
const focusCompleted: CompletedSession = { phase: 'completed', mode: 'focus', completedAt: NOW };

const remaining = (session: TimerSession, now: number) => {
  const startedAt = completedEffectStartedAt(session);

  return startedAt === null ? null : completedEffectRemainingMs({ startedAt, now });
};

describe('완료 연출이 끝나기까지', () => {
  it.each([
    { elapsedMs: 0, expected: 3500 },
    { elapsedMs: 3499, expected: 1 },
    { elapsedMs: 3500, expected: 0 },
    { elapsedMs: 4000, expected: 0 },
  ])('집중 타이머가 끝나고 $elapsedMs밀리초에 $expected밀리초 남는다', ({ elapsedMs, expected }) => {
    expect(remaining(focusCompleted, NOW + elapsedMs)).toBe(expected);
  });

  it.each([
    { elapsedMs: 0, expected: 3500 },
    { elapsedMs: 3499, expected: 1 },
    { elapsedMs: 3500, expected: 0 },
    { elapsedMs: 4000, expected: 0 },
  ])('휴식 타이머가 시작되고 $elapsedMs밀리초에 $expected밀리초 남는다', ({ elapsedMs, expected }) => {
    expect(remaining(resting, NOW + elapsedMs)).toBe(expected);
  });

  // 기기 시각을 뒤로 돌리면 `completedAt`이 미래가 됨
  it('끝난 시각이 1초 뒤 미래여도 연출 길이를 넘지 않는다', () => {
    expect(remaining(focusCompleted, NOW - 1000)).toBe(3500);
  });

  it('휴식 타이머 시작 1초 뒤에 멈췄다 한 시간 뒤에 재개해도 남지 않는다', () => {
    const stopped = pauseTimer({ session: resting, now: NOW + 1000 });
    const resumedAt = NOW + 60 * MINUTE_IN_MS;

    expect(remaining(resumeTimer({ session: stopped, now: resumedAt }), resumedAt)).toBe(0);
  });

  it.each([
    { label: '휴식 타이머 완료', session: { phase: 'completed', mode: 'rest', completedAt: NOW } },
    { label: '집중 타이머 진행', session: { phase: 'running', mode: 'focus', startedAt: NOW, endsAt: NOW + 25 * MINUTE_IN_MS } },
    { label: '휴식 타이머 일시정지', session: { phase: 'paused', mode: 'rest', startedAt: NOW - MINUTE_IN_MS, pausedRemainingMs: 4 * MINUTE_IN_MS } },
    { label: '집중 타이머 대기', session: READY_SESSION },
  ] as { label: string; session: TimerSession }[])('$label에서는 잴 수 없다', ({ session }) => {
    expect(remaining(session, NOW)).toBeNull();
  });
});
