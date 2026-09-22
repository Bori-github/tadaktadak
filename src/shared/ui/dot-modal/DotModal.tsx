import { useMemo, type JSX, type ReactNode } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { DotCells, rectangleCells } from '@/shared/ui/dot-shape';
import { BACK_ICON, CLOSE_ICON, IconButton } from '@/shared/ui/icon-button';

/** 배율 1의 논리 픽셀. 피그마 `모달 · 설정` */
const SIDE_MARGIN = 24;
const TOP = 234;
const BUTTON_INSET = 16;

type DotModalProps = {
  visible: boolean;
  /** 도트 한 변 (px) */
  dotSize: number;
  heightInDots: number;
  onClose: () => void;
  /** Android 뒤로 버튼도 이 핸들러로 연결 */
  onBack?: () => void;
  children?: ReactNode;
};

export const DotModal = ({ visible, dotSize, heightInDots, onClose, onBack, children }: DotModalProps): JSX.Element => {
  const { width } = useWindowDimensions();
  const scale = dotSize / DOT_SIZE;

  // 패널 모서리가 도트 격자에 맞도록 너비를 도트 단위로 내림
  const widthInDots = Math.floor((width - SIDE_MARGIN * 2 * scale) / dotSize);
  const cells = useMemo(() => rectangleCells({ widthInDots, heightInDots }), [widthInDots, heightInDots]);

  const panelStyle = { left: SIDE_MARGIN * scale, top: TOP * scale, width: widthInDots * dotSize, height: heightInDots * dotSize };
  const closeButtonStyle = { top: BUTTON_INSET * scale, right: BUTTON_INSET * scale };
  const backButtonStyle = { top: BUTTON_INSET * scale, left: BUTTON_INSET * scale };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onBack ?? onClose}>
      <View style={styles.dim}>
        <View style={[styles.panel, panelStyle]}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <DotCells cells={cells} dotSize={dotSize} colors={COLORS.modal} />
          </Canvas>
          {children}
          {onBack === undefined ? null : <IconButton testID="modal-back" dotSize={dotSize} icon={BACK_ICON} style={[styles.button, backButtonStyle]} onPress={onBack} />}
          <IconButton testID="modal-close" dotSize={dotSize} icon={CLOSE_ICON} style={[styles.button, closeButtonStyle]} onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  dim: {
    flex: 1,
    backgroundColor: COLORS.modal.dim,
  },
  panel: {
    position: 'absolute',
  },
  button: {
    position: 'absolute',
  },
});
