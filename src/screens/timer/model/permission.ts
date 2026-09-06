import { PermissionStatus } from 'expo';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * 알림 권한 상태. `SPEC.md` 권한
 *
 * 사용자가 권한 허용 여부를 선택하지 않은 경우, 권한 요청
 * 이후 포그라운드 상태일 때마다 확인
 * iOS는 한 번 거부하면 요청 창을 다시 띄우지 않음
 *
 * @returns 권한 상태. 권한 확인 전에는 `null`
 */
export const useNotificationPermission = (): PermissionStatus | null => {
  // 권한 확인 전은 `null`로 처리하여 `undetermined`와 구분
  const [status, setStatus] = useState<PermissionStatus | null>(null);

  useEffect(() => {
    let isEffectAlive = true;
    let isRequestingPermission = false;

    const permissionStatus = async (): Promise<PermissionStatus> => {
      const current = await Notifications.getPermissionsAsync();
      return current.status;
    };

    const requestOnFirstRun = async (): Promise<void> => {
      const current = await permissionStatus();
      if (!isEffectAlive) return;

      if (current !== PermissionStatus.UNDETERMINED) {
        setStatus(current);
        return;
      }

      isRequestingPermission = true;
      try {
        const answered = await Notifications.requestPermissionsAsync();
        if (isEffectAlive) setStatus(answered.status);
      } finally {
        isRequestingPermission = false;
      }
    };

    const syncOnForeground = async (): Promise<void> => {
      // 요청 창이 닫히며 포그라운드로 돌아오는 것이 응답과 겹침. 창이 떠 있는 동안 읽은 값이 응답을 덮으므로, 요청 중에는 건너뜀
      if (isRequestingPermission) return;

      const current = await permissionStatus();
      if (isEffectAlive) setStatus(current);
    };

    // 권한 확인 실패 시 권한 상태 `null`로 설정
    // 다음 포그라운드 복귀에서 다시 확인
    requestOnFirstRun().catch(() => {});

    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      syncOnForeground().catch(() => {});
    });

    return () => {
      isEffectAlive = false;
      subscription.remove();
    };
  }, []);

  return status;
};
