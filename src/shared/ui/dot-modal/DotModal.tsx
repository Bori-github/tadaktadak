import { useEffect, useMemo, type JSX, type ReactNode } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions, View } from 'react-native';
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

  useEffect(() => {
    if (!visible) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      (onBack ?? onClose)();
      return true;
    });

    return () => subscription.remove();
  }, [visible, onBack, onClose]);

  // Modal은 visible false 시 자식 언마운트로 Canvas 첫 페인트 지연. 상시 마운트 후 opacity 0으로 처리
  return (
    <View style={[StyleSheet.absoluteFill, styles.dim, !visible && styles.hidden]} pointerEvents={visible ? 'auto' : 'none'}>
      {/* view flattening 시 표시 전환마다 Canvas 재페인트 지연. flattening 비활성화 */}
      <View collapsable={false} style={[styles.panel, panelStyle]}>
        <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
          <DotCells cells={cells} dotSize={dotSize} colors={COLORS.modal} />
        </Canvas>
        {children}
        {onBack === undefined ? null : <IconButton testID="modal-back" dotSize={dotSize} icon={BACK_ICON} style={[styles.button, backButtonStyle]} onPress={onBack} />}
        <IconButton testID="modal-close" dotSize={dotSize} icon={CLOSE_ICON} style={[styles.button, closeButtonStyle]} onPress={onClose} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  dim: {
    backgroundColor: COLORS.modal.dim,
  },
  hidden: {
    opacity: 0,
  },
  panel: {
    position: 'absolute',
  },
  button: {
    position: 'absolute',
  },
});
