import { type JSX } from 'react';
import { Linking, Pressable } from 'react-native';

import { BUTTON_TOUCH_PADDING, ROUND_BUTTON_DIAMETER_IN_DOTS } from '@/shared/constants';

const touchArea = (centerX: number, centerY: number, dotSize: number) => {
  const size = ROUND_BUTTON_DIAMETER_IN_DOTS * dotSize + BUTTON_TOUCH_PADDING;

  return {
    position: 'absolute',
    left: centerX - size / 2,
    top: centerY - size / 2,
    width: size,
    height: size,
  } as const;
};

/** 알림 설정 버튼의 터치 영역. `DESIGN.md` §8 조작 */
type NotificationSettingsButtonProps = {
  /** 버튼 중심 (px) */
  centerX: number;
  centerY: number;
  /** 도트 한 변 (px) */
  dotSize: number;
  onPressedChange: (pressed: boolean) => void;
};

export const NotificationSettingsButton = ({ centerX, centerY, dotSize, onPressedChange }: NotificationSettingsButtonProps): JSX.Element => {
  return (
    <Pressable
      accessibilityRole="button"
      style={touchArea(centerX, centerY, dotSize)}
      onPressIn={() => onPressedChange(true)}
      onPressOut={() => onPressedChange(false)}
      // 설정 앱 열기 실패 시 화면 변화 없음
      onPress={() => Linking.openSettings().catch(() => {})}
    />
  );
};
