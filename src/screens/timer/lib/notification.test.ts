import { PermissionStatus } from 'expo';
import { describe, expect, it } from '@jest/globals';

import { scheduleAt } from './notification';

import { NOW, type TimerSession } from '@/entities/timer';

const MINUTE_MS = 60_000;

const RUNNING: TimerSession = { phase: 'running', mode: 'focus', startedAt: NOW, endsAt: NOW + MINUTE_MS };

const NOT_RUNNING: { situation: string; session: TimerSession }[] = [
  { situation: '대기', session: { phase: 'ready', mode: 'focus' } },
  { situation: '일시정지', session: { phase: 'paused', mode: 'focus', startedAt: NOW, pausedRemainingMs: MINUTE_MS } },
  { situation: '완료', session: { phase: 'completed', mode: 'focus' } },
];

const WITHOUT_PERMISSION: { situation: string; status: PermissionStatus | null }[] = [
  { situation: '거부', status: PermissionStatus.DENIED },
  { situation: '아직 묻지 않음', status: PermissionStatus.UNDETERMINED },
  { situation: '아직 읽지 않음', status: null },
];

const at = (session: TimerSession, status: PermissionStatus | null) => scheduleAt({ session, status, now: NOW });

describe('알림을 걸 시각', () => {
  it('진행 중이고 권한이 있으면 끝날 시각이다', () => {
    expect(at(RUNNING, PermissionStatus.GRANTED)).toBe(NOW + MINUTE_MS);
  });

  it.each(WITHOUT_PERMISSION)('권한이 $situation이면 걸지 않는다', ({ status }) => {
    expect(at(RUNNING, status)).toBeNull();
  });

  it.each(NOT_RUNNING)('$situation 상태에서는 걸지 않는다', ({ session }) => {
    expect(at(session, PermissionStatus.GRANTED)).toBeNull();
  });

  it('끝날 시각이 이미 지났으면 걸지 않는다', () => {
    const passed: TimerSession = { phase: 'running', mode: 'focus', startedAt: NOW - MINUTE_MS, endsAt: NOW };

    expect(at(passed, PermissionStatus.GRANTED)).toBeNull();
  });
});
