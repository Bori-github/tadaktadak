import { useEffect, type JSX, type ReactNode } from 'react';
import { BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { BACK_ICON, CLOSE_ICON, IconButton } from '@/shared/ui/icon-button';

/** 배율 1의 논리 픽셀. 피그마 `설정 화면 · 페이지` */
const CONTENT_WIDTH = 342;
const BUTTON_INSET = 16;

type DotModalProps = {
  /** 도트 한 변 (px) */
  dotSize: number;
  onClose: () => void;
  /** Android 뒤로 버튼도 이 핸들러로 연결 */
  onBack?: () => void;
  children?: ReactNode;
};

export const DotModal = ({ dotSize, onClose, onBack, children }: DotModalProps): JSX.Element => {
  const insets = useSafeAreaInsets();
  const scale = dotSize / DOT_SIZE;

  const contentStyle = { marginTop: insets.top, width: CONTENT_WIDTH * scale };
  const closeButtonStyle = { top: insets.top + BUTTON_INSET * scale, right: insets.right + BUTTON_INSET * scale };
  const backButtonStyle = { top: insets.top + BUTTON_INSET * scale, left: insets.left + BUTTON_INSET * scale };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      (onBack ?? onClose)();
      return true;
    });

    return () => subscription.remove();
  }, [onBack, onClose]);

  return (
    <View style={styles.root}>
      <View style={[styles.content, contentStyle]}>{children}</View>
      {onBack === undefined ? null : <IconButton testID="modal-back" dotSize={dotSize} icon={BACK_ICON} style={[styles.button, backButtonStyle]} onPress={onBack} />}
      <IconButton testID="modal-close" dotSize={dotSize} icon={CLOSE_ICON} style={[styles.button, closeButtonStyle]} onPress={onClose} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.modal.face,
  },
  content: {
    flex: 1,
    alignSelf: 'center',
  },
  button: {
    position: 'absolute',
  },
});
