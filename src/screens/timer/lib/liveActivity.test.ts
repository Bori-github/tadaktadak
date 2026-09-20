import { describe, expect, it } from '@jest/globals';

import { activityContent } from './liveActivity';

import { MINUTE_IN_MS, NOW, type TimerMode, type TimerSession } from '@/entities/timer';

const SETTING_MINUTES: Record<TimerMode, number> = { focus: 25, rest: 5 };

const FOCUS_MS = SETTING_MINUTES.focus * MINUTE_IN_MS;

const RUNNING: TimerSession = { phase: 'running', mode: 'focus', startedAt: NOW, endsAt: NOW + FOCUS_MS };

const NOT_RUNNING: { situation: string; session: TimerSession }[] = [
  { situation: '대기', session: { phase: 'ready', mode: 'focus' } },
  { situation: '일시정지', session: { phase: 'paused', mode: 'focus', startedAt: NOW, pausedRemainingMs: FOCUS_MS } },
  { situation: '완료', session: { phase: 'completed', mode: 'focus', completedAt: NOW } },
];

const contentAt = (session: TimerSession, now: number) => activityContent({ session, settingMinutes: SETTING_MINUTES, language: 'ko-KR', now });

describe('잠금화면에 표시할 내용', () => {
  it('일시정지했다 재개해도 진행 막대가 타이머 시간만큼만 찬다', () => {
    const resumedAt = NOW + 10 * MINUTE_IN_MS;
    // 5분 쓰고 멈췄다가 10분 뒤 재개. 남은 20분은 그대로고 끝날 시각만 밀림
    const resumed: TimerSession = { phase: 'running', mode: 'focus', startedAt: NOW, endsAt: resumedAt + 20 * MINUTE_IN_MS };

    const content = contentAt(resumed, resumedAt);

    expect(content && content.endsAt - content.progressStartsAt).toBe(FOCUS_MS);
  });

  it('타이머 모드를 그대로 쓴다', () => {
    const rest: TimerSession = { phase: 'running', mode: 'rest', startedAt: NOW, endsAt: NOW + MINUTE_IN_MS };

    expect(contentAt(rest, NOW)?.mode).toBe('rest');
  });

  it.each(NOT_RUNNING)('$situation 상태에서는 시작하지 않는다', ({ session }) => {
    expect(contentAt(session, NOW)).toBeNull();
  });

  it('끝날 시각이 지났으면 시작하지 않는다', () => {
    expect(contentAt(RUNNING, NOW + FOCUS_MS)).toBeNull();
  });

  it('끝날 시각이 1밀리초 남았으면 시작한다', () => {
    expect(contentAt(RUNNING, NOW + FOCUS_MS - 1)).not.toBeNull();
  });
});
