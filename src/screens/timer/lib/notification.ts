import { PermissionStatus } from 'expo';

import { type TimerMode, type TimerSession } from '@/entities/timer';
import { translate, type Language } from '@/shared/lib';

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
