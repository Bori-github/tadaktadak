import { PermissionStatus } from 'expo';
import { beforeAll, describe, expect, it } from '@jest/globals';

import { completionNotificationOptions, completionNotificationBehavior, isNotificationBlocked, notificationBody, scheduleAt } from './notification';
import { BANNER_CHANNEL_ID, VIBRATION_CHANNEL_ID } from '../config/notification';

import { initLocalization } from '@/entities/language';
import { NOW, type TimerSession } from '@/entities/timer';

beforeAll(() => {
  initLocalization();
});

const MINUTE_MS = 60_000;

const RUNNING: TimerSession = { phase: 'running', mode: 'focus', startedAt: NOW, endsAt: NOW + MINUTE_MS };

const NOT_RUNNING: { situation: string; session: TimerSession }[] = [
  { situation: '대기', session: { phase: 'ready', mode: 'focus' } },
  { situation: '일시정지', session: { phase: 'paused', mode: 'focus', startedAt: NOW, pausedRemainingMs: MINUTE_MS } },
  { situation: '완료', session: { phase: 'completed', mode: 'focus', completedAt: NOW } },
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

describe('알림이 막힌 상태', () => {
  it.each<{ situation: string; status: PermissionStatus | null; blocked: boolean }>([
    { situation: '아직 읽지 않음', status: null, blocked: false },
    { situation: '허용', status: PermissionStatus.GRANTED, blocked: false },
    { situation: '아직 묻지 않음', status: PermissionStatus.UNDETERMINED, blocked: true },
    { situation: '거부', status: PermissionStatus.DENIED, blocked: true },
  ])('$situation이면 $blocked', ({ status, blocked }) => {
    expect(isNotificationBlocked(status)).toBe(blocked);
  });
});

describe('알림 본문', () => {
  it('한국어는 다국어 적용 전과 같은 문구를 반환한다', () => {
    expect(notificationBody('focus', 'ko-KR')).toBe('집중 끝!');
    expect(notificationBody('rest', 'ko-KR')).toBe('휴식 끝!');
  });
});

describe('completionNotificationOptions', () => {
  it.each(['android', 'ios'] as const)('%s: 진동 사용 여부가 켜져 있으면 vibration, 꺼져 있으면 banner 채널 ID를 반환한다', (platform) => {
    expect(completionNotificationOptions({ isVibrationEnabled: true, platform }).channelId).toBe(VIBRATION_CHANNEL_ID);
    expect(completionNotificationOptions({ isVibrationEnabled: false, platform }).channelId).toBe(BANNER_CHANNEL_ID);
  });

  it('iOS는 content.sound에 진동 사용 여부를 지정한다', () => {
    expect(completionNotificationOptions({ isVibrationEnabled: true, platform: 'ios' }).content).toEqual({ sound: true });
    expect(completionNotificationOptions({ isVibrationEnabled: false, platform: 'ios' }).content).toEqual({ sound: false });
  });

  it('Android는 setSilent 판정을 피하도록 content.sound를 지정하지 않는다', () => {
    expect(completionNotificationOptions({ isVibrationEnabled: false, platform: 'android' }).content).toEqual({});
  });
});

describe('completionNotificationBehavior', () => {
  it.each(['android', 'ios'] as const)('%s: canVibrate가 true면 배너·알림 목록·알림음을 모두 비활성화한다', (platform) => {
    expect(completionNotificationBehavior({ canVibrate: true, platform })).toEqual({
      shouldShowBanner: false,
      shouldShowList: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });

  it('Android는 canVibrate가 false면 setSilent 판정을 피하도록 shouldPlaySound를 true로 반환한다', () => {
    expect(completionNotificationBehavior({ canVibrate: false, platform: 'android' })).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    });
  });

  it('iOS는 canVibrate가 false면 shouldPlaySound를 false로 반환한다', () => {
    expect(completionNotificationBehavior({ canVibrate: false, platform: 'ios' })).toEqual({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    });
  });
});
