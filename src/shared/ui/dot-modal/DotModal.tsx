import { useMemo, type JSX, type ReactNode } from 'react';
import { Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Canvas, Group, Rect } from '@shopify/react-native-skia';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { rectangleCells } from '@/shared/ui/dot-button';
import { CLOSE_STROKES, IconButton } from '@/shared/ui/icon-button';

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
  children?: ReactNode;
};

export const DotModal = ({ visible, dotSize, heightInDots, onClose, children }: DotModalProps): JSX.Element => {
  const { width } = useWindowDimensions();
  const scale = dotSize / DOT_SIZE;

  // 패널 모서리가 도트 격자에 맞도록 너비를 도트 단위로 내림
  const widthInDots = Math.floor((width - SIDE_MARGIN * 2 * scale) / dotSize);
  const cells = useMemo(() => rectangleCells({ widthInDots, heightInDots }), [widthInDots, heightInDots]);

  const panelStyle = { left: SIDE_MARGIN * scale, top: TOP * scale, width: widthInDots * dotSize, height: heightInDots * dotSize };
  const closeButtonStyle = { top: BUTTON_INSET * scale, right: BUTTON_INSET * scale };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={styles.dim}>
        <View style={[styles.panel, panelStyle]}>
          <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
            <Group antiAlias={false}>
              {cells.map((cell) => (
                <Rect
                  key={cell.key}
                  x={cell.column * dotSize}
                  y={cell.row * dotSize}
                  width={cell.widthInDots * dotSize}
                  height={cell.heightInDots * dotSize}
                  color={COLORS.modal[cell.role]}
                />
              ))}
            </Group>
          </Canvas>
          {children}
          <IconButton testID="modal-close" dotSize={dotSize} strokes={CLOSE_STROKES} style={[styles.button, closeButtonStyle]} onPress={onClose} />
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
