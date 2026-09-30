import { PermissionStatus } from 'expo';
import { type NotificationBehavior, type NotificationContentInput } from 'expo-notifications';
import { type PlatformOSType } from 'react-native';

import { BANNER_CHANNEL_ID, VIBRATION_CHANNEL_ID } from '../config/notification';

import { type TimerMode, type TimerSession } from '@/entities/timer';
import { translate, type Language } from '@/entities/language';

type ScheduleInput = {
  session: TimerSession;
  status: PermissionStatus | null;
  now: number;
};

/**
 * 타이머가 끝났을 때 띄울 알림 본문. 제목은 앱 이름
 *
 * @param mode - 끝난 타이머
 * @returns 알림 본문
 */
export const notificationBody = (mode: TimerMode, language: Language): string => {
  return translate(`timer.${mode}`, language);
};

/**
 * 알림이 오지 못하는 상태. `SPEC.md` 권한
 *
 * @param status - 알림 권한 상태. 확인 전에는 `null`
 * @returns 권한을 확인했고 허용이 아니면 true
 */
export const isNotificationBlocked = (status: PermissionStatus | null): boolean => {
  return status !== null && status !== PermissionStatus.GRANTED;
};

/**
 * 알림을 예약할 시각. 예약하지 않는 조건을 여기서 판정. `SPEC.md` 상태 전이 시 처리
 *
 * @param input.session - 타이머 세션 값
 * @param input.status - 알림 권한 상태
 * @param input.now - 지금 시각 (밀리초)
 * @returns 예약할 시각 (밀리초). 예약하지 않는 경우 `null`
 */
export const scheduleAt = ({ session, status, now }: ScheduleInput): number | null => {
  if (session.phase !== 'running') return null;

  // 권한이 없으면 iOS가 예약을 오류 없이 받고 버림
  // 호출 결과로 실패를 알 수 없어 여기서 차단
  if (status !== PermissionStatus.GRANTED) return null;

  // 지난 시각으로 예약하면 음수 간격이 되어 예외 발생
  if (session.endsAt <= now) return null;

  return session.endsAt;
};

type CompletionNotificationOptionsInput = {
  isVibrationEnabled: boolean;
  platform: PlatformOSType;
};

type CompletionNotificationOptions = {
  /** Android 알림 채널 ID */
  channelId: string;
  /** 알림 `content`에 병합할 필드 */
  content: Pick<NotificationContentInput, 'sound'>;
};

/**
 * 완료 알림 예약 옵션. 백그라운드 알림은 `setNotificationHandler`를 거치지 않아 예약 시점의 진동 사용 여부로 결정
 *
 * @returns Android 채널 ID와 `content`에 병합할 필드
 */
export const completionNotificationOptions = ({ isVibrationEnabled, platform }: CompletionNotificationOptionsInput): CompletionNotificationOptions => ({
  channelId: isVibrationEnabled ? VIBRATION_CHANNEL_ID : BANNER_CHANNEL_ID,
  // iOS 알림 진동은 알림음에 종속되어 `sound: false`면 진동도 없음
  // Android는 `sound: false`면 무음 알림(`setSilent`)으로 게시되어 헤드업이 표시되지 않으므로 iOS에만 지정
  content: platform === 'ios' ? { sound: isVibrationEnabled } : {},
});

type CompletionNotificationBehaviorInput = {
  canVibrate: boolean;
  platform: PlatformOSType;
};

/**
 * 포그라운드에서 받은 완료 알림의 표시 방식
 *
 * @param input.canVibrate - 완료 진동 재생 가능 여부. 햅틱 미지원 기기이거나 진동 사용 여부가 꺼져 있으면 `false`
 * @returns `setNotificationHandler`가 반환할 표시 방식
 */
export const completionNotificationBehavior = ({ canVibrate, platform }: CompletionNotificationBehaviorInput): NotificationBehavior => {
  // 완료 진동이 없으면 포그라운드에서도 배너로 대체
  const showsBanner = !canVibrate;

  return {
    shouldShowBanner: showsBanner,
    shouldShowList: showsBanner,
    // `shouldPlaySound: false`면 Android가 무음 알림(`setSilent`)으로 게시해 헤드업 미표시. 채널에 알림음이 없어 재생 없음
    shouldPlaySound: showsBanner && platform === 'android',
    shouldSetBadge: false,
  };
};
