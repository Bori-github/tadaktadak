import { memo, useEffect, useState, type JSX } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { type RectIcon, RectIconShape } from '@/shared/ui/dot-icon';
import { DotCells, type DotRole, roundedRectangleShape } from '@/shared/ui/dot-shape';
import { Portal, usePortalHost } from '@/shared/ui/portal';

/** 표시 유지 시간 (밀리초) */
const DURATION_MS = 3500;

/** 배율 1의 논리 픽셀. 피그마 `toast` */
const PADDING_X = 14;
const PADDING_Y = 10;
const ICON_GAP = 10;

// `roundedRectangleShape`가 highlight 역할을 생성하지 않아 `DotCells` 색 타입 충족용으로 face 색 지정
const TOAST_COLORS: Record<DotRole, string> = { ...COLORS.toast, highlight: COLORS.toast.face };

type DotToastProps = {
  text: string;
  icon: RectIcon;
  /** 도트 한 변 (px) */
  dotSize: number;
  /** 몸통 위 끝 (px). `PortalHost` 기준 */
  top: number;
  isVisible: boolean;
  /** 표시 중 화면 터치, Android 뒤로 가기, 표시 3.5초 경과 시 호출 */
  onClose: () => void;
  /** 몸통 `View`에 지정 */
  testID?: string;
};

type TextSize = { width: number; height: number };

/**
 * `PortalHost` 가로 가운데에 표시하는 도트 토스트. 표시 중 터치는 닫기만 하고 터치한 곳의 조작으로 전달되지 않음.
 * 타이머 화면이 매초 리렌더링되어도 도형을 다시 만들지 않도록 `memo`
 *
 * @returns 문구 측정용 `View`. 몸통은 `PortalHost`가 렌더링
 */
const DotToastContent = ({ text, icon, dotSize, top, isVisible, onClose, testID }: DotToastProps): JSX.Element | null => {
  const [textSize, setTextSize] = useState<TextSize | null>(null);
  const { hostWidth, isEnabled } = usePortalHost();

  // 몸통 렌더링 시점부터 표시 시간 측정. 스플래시로 `PortalHost`가 비활성인 동안은 측정하지 않음
  const isShown = isVisible && textSize !== null && isEnabled;

  useEffect(() => {
    if (!isShown) return;

    const timer = setTimeout(onClose, DURATION_MS);

    return () => clearTimeout(timer);
  }, [isShown, onClose]);

  if (!isVisible) return null;

  const scale = dotSize / DOT_SIZE;
  const textStyle = [styles.text, { fontSize: 16 * scale, lineHeight: 20 * scale }];

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const { layout } = event.nativeEvent;
    setTextSize({ width: Math.ceil(layout.width), height: layout.height });
  };

  const measurer = (
    <View style={styles.measurer} pointerEvents="none">
      <Text style={textStyle} onLayout={handleTextLayout}>
        {text}
      </Text>
    </View>
  );

  // 문구 크기 측정 전 `DismissLayer`, `BackHandler` 리스너가 입력을 받지 않도록 측정 뒤에 `Portal` mount
  if (textSize === null) return measurer;

  const iconSize = icon.boxSize * scale;
  const bodyHeightInDots = Math.ceil((PADDING_Y * 2 * scale + iconSize) / dotSize);
  const shape = roundedRectangleShape({
    widthInDots: Math.ceil(((PADDING_X * 2 + ICON_GAP) * scale + iconSize + textSize.width) / dotSize),
    heightInDots: bodyHeightInDots,
  });
  const width = shape.widthInDots * dotSize;
  const iconLeft = PADDING_X * scale;
  const iconTop = PADDING_Y * scale;
  const textBoxStyle = { left: iconLeft + iconSize + ICON_GAP * scale, top: (bodyHeightInDots * dotSize - textSize.height) / 2 };

  return (
    <>
      {measurer}
      <Portal onDismiss={onClose}>
        <View testID={testID} style={[styles.toast, { left: (hostWidth - width) / 2, top, width, height: shape.heightInDots * dotSize }]} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            <DotCells cells={shape.cells} dotSize={dotSize} colors={TOAST_COLORS} />
            <RectIconShape icon={icon} left={iconLeft} top={iconTop} dotSize={dotSize} color={COLORS.toast.edge} />
          </Canvas>
          <Text style={[textStyle, styles.toastText, textBoxStyle]}>{text}</Text>
        </View>
      </Portal>
    </>
  );
};

export const DotToast = memo(DotToastContent);

const styles = StyleSheet.create({
  text: {
    color: COLORS.text.primary,
  },
  measurer: {
    position: 'absolute',
    alignItems: 'flex-start',
    opacity: 0,
  },
  toast: {
    position: 'absolute',
  },
  toastText: {
    position: 'absolute',
  },
});
