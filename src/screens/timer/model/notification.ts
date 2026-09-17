import * as Notifications from 'expo-notifications';
import { type PermissionStatus } from 'expo';
import { useEffect } from 'react';

import { notificationBody, scheduleAt } from '../lib/notification';

import { type TimerSession } from '@/entities/timer';
import { translate, useLanguage } from '@/shared/lib';

type NotificationScheduleInput = {
  session: TimerSession;
  status: PermissionStatus | null;
  isSettled: boolean;
};

/**
 * 진행 상태이면 타이머가 끝날 시각에 알림을 예약하고, 벗어나면 취소. `SPEC.md` 상태 전이 시 처리
 *
 * @param input.session - 타이머 세션 값. 단계가 바뀔 때만 새 객체라 카운트다운 중에도 이펙트가 다시 돌지 않음
 * @param input.status - 알림 권한 상태
 * @param input.isSettled - 저장값 읽기가 끝났는지
 * @returns 없음
 */
export const useNotificationSchedule = ({ session, status, isSettled }: NotificationScheduleInput): void => {
  const language = useLanguage();

  useEffect(() => {
    let live = true;

    // 권한 확인이나 저장값 읽기가 끝나기 전에 취소하면 지난 실행이 걸어 둔 알림이 지워지므로, 둘 다 완료된 후 실행
    if (status === null || !isSettled) return;

    const at = scheduleAt({ session, status, now: Date.now() });

    // 취소와 예약을 한 함수에서 이어 실행
    // 따로 호출하면 늦게 도착한 취소가 방금 예약한 알림을 지움
    const apply = async (): Promise<void> => {
      // 예약하는 알림이 하나뿐이라 전부 취소
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!live || at === null) return;

      await Notifications.scheduleNotificationAsync({
        content: { title: translate('app.name', language), body: notificationBody(session.mode, language) },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
      });
    };

    // 예약에 실패해도 타이머는 그대로 진행. 알림만 도착하지 않음
    apply().catch(() => {});

    // 화면이 사라질 때 취소하지 않음
    // 앱 종료 뒤에도 예약한 알림은 도착해야 함
    return () => {
      live = false;
    };
  }, [session, status, isSettled, language]);
};
