import { memo } from 'react';
import { Linking, Pressable } from 'react-native';

import { BUTTON_TOUCH_PADDING, ROUND_BUTTON_DIAMETER_IN_DOTS } from '@/shared/constants';
import { touchArea, vibrate } from '@/shared/lib';

/** 알림 설정 버튼의 터치 영역. `DESIGN.md` §8 조작 */
type NotificationSettingsButtonProps = {
  /** 버튼 중심 (px) */
  centerX: number;
  centerY: number;
  /** 도트 한 변 (px) */
  dotSize: number;
  onPressedChange: (pressed: boolean) => void;
};

export const NotificationSettingsButton = memo(({ centerX, centerY, dotSize, onPressedChange }: NotificationSettingsButtonProps) => {
  const size = ROUND_BUTTON_DIAMETER_IN_DOTS * dotSize + BUTTON_TOUCH_PADDING;

  return (
    <Pressable
      accessibilityRole="button"
      style={touchArea({ centerX, centerY, size })}
      onPressIn={() => {
        vibrate();
        onPressedChange(true);
      }}
      onPressOut={() => onPressedChange(false)}
      // 설정 앱 열기 실패 시 화면 변화 없음
      onPress={() => Linking.openSettings().catch(() => {})}
    />
  );
});

NotificationSettingsButton.displayName = 'NotificationSettingsButton';
