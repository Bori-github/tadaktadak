import { memo } from 'react';
import { Linking, type StyleProp, type ViewStyle } from 'react-native';

import { RoundDotButton } from '@/shared/ui/dot-button';
import { NOTIFICATION_OFF_ICON } from '@/shared/ui/dot-icon';

type NotificationSettingsButtonProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  style?: StyleProp<ViewStyle>;
};

export const NotificationSettingsButton = memo(({ dotSize, style }: NotificationSettingsButtonProps) => (
  <RoundDotButton
    testID="notification-settings"
    dotSize={dotSize}
    icon={NOTIFICATION_OFF_ICON}
    style={style}
    // 설정 앱 열기 실패 시 화면 변화 없음
    onPress={() => Linking.openSettings().catch(() => {})}
  />
));

NotificationSettingsButton.displayName = 'NotificationSettingsButton';
