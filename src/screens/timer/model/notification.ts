import * as Notifications from 'expo-notifications';
import { type PermissionStatus } from 'expo';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { notificationBody, scheduleAt } from '../lib/notification';

import { type TimerSession } from '@/entities/timer';
import { translate, useLanguage, type Language } from '@/entities/language';
import { useVibrationEnabled } from '@/entities/vibration';

/** 진동 사용 여부가 켜졌을 때의 완료 알림 채널. 소리 없음, 진동 있음 */
const VIBRATION_CHANNEL_ID = 'vibration';
/** 진동 사용 여부가 꺼졌을 때의 완료 알림 채널. 소리·진동 없음 */
const BANNER_CHANNEL_ID = 'banner';
/** 채널을 지정하지 않은 알림에 `expo-notifications`가 만든 채널. `BANNER_CHANNEL_ID`·`VIBRATION_CHANNEL_ID`로 대체해 삭제 */
const FALLBACK_CHANNEL_ID = 'expo_notifications_fallback_notification_channel';

/** 마지막 채널 등록. 알림 예약 전에 완료를 대기 */
let channelsReady: Promise<unknown> = Promise.resolve();

/**
 * 알림 채널 등록. 이미 등록된 채널은 이름만 갱신
 *
 * @param language - 채널 이름 언어
 * @returns 등록이 끝나면 이행하는 프로미스
 */
const registerNotificationChannelsForAndroid = (language: Language): Promise<unknown> =>
  Promise.all([
    Notifications.setNotificationChannelAsync(VIBRATION_CHANNEL_ID, {
      name: translate('notification.vibrationChannel', language),
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: true,
      sound: null,
    }),
    Notifications.setNotificationChannelAsync(BANNER_CHANNEL_ID, {
      name: translate('notification.bannerChannel', language),
      importance: Notifications.AndroidImportance.HIGH,
      enableVibrate: false,
      // 벨소리 진동 모드에서 알림음이 진동으로 변환되므로 알림음 제거
      sound: null,
    }),
    Notifications.deleteNotificationChannelAsync(FALLBACK_CHANNEL_ID),
  ]);

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
  const isVibrationEnabled = useVibrationEnabled();

  // 앱 시작 시와 언어 변경 시 등록해 설정 화면의 채널 이름을 앱 언어와 일치
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    channelsReady = registerNotificationChannelsForAndroid(language);
    // 실패하면 예약 직전에 다시 등록
    channelsReady.catch(() => {});
  }, [language]);

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

      // 존재하지 않는 채널의 알림은 Android가 폐기하므로 예약 전 채널 등록 대기
      if (Platform.OS === 'android') await channelsReady.catch(() => registerNotificationChannelsForAndroid(language));

      await Notifications.scheduleNotificationAsync({
        // 백그라운드 알림은 `setNotificationHandler`를 거치지 않아 예약 시점의 진동 사용 여부로 채널(Android)·알림음(iOS) 결정
        // iOS 알림 진동은 알림음에 종속되어 `sound: false`면 진동도 없음
        // Android는 `sound: false`면 무음 알림(`setSilent`)으로 게시되어 헤드업이 표시되지 않으므로 iOS에만 지정
        content: { title: translate('app.name', language), body: notificationBody(session.mode, language), ...(Platform.OS === 'ios' && { sound: isVibrationEnabled }) },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: isVibrationEnabled ? VIBRATION_CHANNEL_ID : BANNER_CHANNEL_ID },
      });
    };

    // 예약에 실패해도 타이머는 그대로 진행. 알림만 도착하지 않음
    apply().catch(() => {});

    // 화면이 사라질 때 취소하지 않음
    // 앱 종료 뒤에도 예약한 알림은 도착해야 함
    return () => {
      live = false;
    };
  }, [session, status, isSettled, language, isVibrationEnabled]);
};
