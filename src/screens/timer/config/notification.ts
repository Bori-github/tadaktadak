/** 진동 사용 여부가 켜졌을 때의 완료 알림 채널. 소리 없음, 진동 있음 */
export const VIBRATION_CHANNEL_ID = 'vibration';
/** 진동 사용 여부가 꺼졌을 때의 완료 알림 채널. 소리·진동 없음 */
export const BANNER_CHANNEL_ID = 'banner';
/** 완료 알림 식별자 접두어. 식별자가 같으면 Android의 만료 요청 정리가 새 예약까지 삭제해 `endsAt`을 붙임 */
export const COMPLETION_NOTIFICATION_ID_PREFIX = 'completion-';
/** 채널을 지정하지 않은 알림에 `expo-notifications`가 만든 채널. `BANNER_CHANNEL_ID`·`VIBRATION_CHANNEL_ID`로 대체해 삭제 */
export const FALLBACK_CHANNEL_ID = 'expo_notifications_fallback_notification_channel';
