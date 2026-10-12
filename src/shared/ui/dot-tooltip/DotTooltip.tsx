import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent, type LayoutRectangle, type StyleProp, type ViewStyle } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, DOT_SIZE } from '@/shared/constants';

import { bubbleShape, DotCells, type BubbleArrowAlign, type BubbleArrowDirection, type DotRole } from '@/shared/ui/dot-shape';
import { Portal, usePortalHost } from '@/shared/ui/portal';

import { bubbleOrigin, maxContentWidthInDots } from './placement';

// `bubbleShape`가 highlight 역할을 생성하지 않아 `DotCells` 색 타입 충족용으로 face 색 지정
const BUBBLE_COLORS: Record<DotRole, string> = { ...COLORS.tooltip, highlight: COLORS.tooltip.face };

type BubbleProps = {
  /** 줄바꿈은 `\n` */
  text: string;
  /** 도트 한 변 (px) */
  dotSize: number;
  arrowDirection: BubbleArrowDirection;
  arrowAlign: BubbleArrowAlign;
  textAlign?: 'left' | 'center' | 'right';
  /** 화살표/테두리 포함 말풍선 고정 너비 (px). `maxWidth`, safe area 좌우 16px 범위로 제한 */
  width?: number;
  /** 화살표/테두리 포함 말풍선 최대 너비 (px). 초과 문구는 줄바꿈 */
  maxWidth?: number;
};

type DotTooltipProps = BubbleProps & {
  isVisible: boolean;
  /** 표시 중 화면 터치, Android 뒤로 가기 시 호출. 같은 `PortalHost`에서는 마지막에 표시한 툴팁만 호출 */
  onClose: () => void;
  /** `children`을 감싼 `View` 스타일 */
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/**
 * `children`을 가리키는 도트 말풍선. 가장 가까운 `PortalHost`에 렌더링
 *
 * @returns `children`을 감싼 `View`
 */
export const DotTooltip = ({ isVisible, onClose, style, children, ...bubble }: DotTooltipProps): JSX.Element => {
  const anchorRef = useRef<View>(null);
  const { hostRef } = usePortalHost();
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);

  const measureAnchor = useCallback(() => {
    const host = hostRef.current;

    if (host === null) return;

    anchorRef.current?.measureLayout(host, (x, y, width, height) => {
      setAnchor({ x, y, width, height });
    });
  }, [hostRef]);

  // 비표시 중 `children` 위치가 변경될 수 있어 표시 시점에 재측정
  useEffect(() => {
    if (isVisible) measureAnchor();
  }, [isVisible, measureAnchor]);

  return (
    <View ref={anchorRef} style={style} collapsable={false} onLayout={measureAnchor}>
      {children}
      {isVisible && anchor !== null ? <Bubble {...bubble} anchor={anchor} onClose={onClose} /> : null}
    </View>
  );
};

type TextSize = { width: number; height: number };

const Bubble = ({
  text,
  dotSize,
  arrowDirection,
  arrowAlign,
  textAlign = 'center',
  width,
  maxWidth,
  anchor,
  onClose,
}: BubbleProps & { anchor: LayoutRectangle; onClose: () => void }): JSX.Element => {
  const [textSize, setTextSize] = useState<TextSize | null>(null);
  const { hostWidth } = usePortalHost();
  const insets = useSafeAreaInsets();

  const scale = dotSize / DOT_SIZE;
  const paddingX = 14 * scale;
  const paddingY = 10 * scale;
  const textStyle = [styles.text, { fontSize: 16 * scale, lineHeight: 20 * scale, textAlign }];

  const arrow = { arrowDirection, arrowAlign };
  const maxContentWidth = maxContentWidthInDots({
    ...arrow,
    anchor,
    dotSize,
    minLeft: insets.left + 16,
    maxRight: hostWidth - insets.right - 16,
    maxWidth: Math.min(width ?? Infinity, maxWidth ?? Infinity),
  });
  const maxTextWidth = Math.floor(maxContentWidth * dotSize - paddingX * 2);

  const handleTextLayout = (event: LayoutChangeEvent) => {
    const { layout } = event.nativeEvent;
    setTextSize({ width: Math.ceil(layout.width), height: layout.height });
  };

  const measurer = (
    <View style={[styles.measurer, { width: maxTextWidth }]} pointerEvents="none">
      <Text style={textStyle} onLayout={handleTextLayout}>
        {text}
      </Text>
    </View>
  );

  // 문구 크기 측정 전 `DismissLayer`, `BackHandler` 리스너가 입력을 받지 않도록 측정 뒤에 `Portal` mount
  if (textSize === null) return measurer;

  const shapeOptions = {
    ...arrow,
    contentWidthInDots: width === undefined ? (textSize.width + paddingX * 2) / dotSize : maxContentWidth,
    contentHeightInDots: (textSize.height + paddingY * 2) / dotSize,
  };
  const shape = bubbleShape(shapeOptions);
  const origin = bubbleOrigin({ ...shapeOptions, anchor, dotSize });

  const textBoxStyle = {
    left: shape.contentColumn * dotSize + paddingX,
    top: shape.contentRow * dotSize + (shape.contentHeightInDots * dotSize - textSize.height) / 2,
    width: shape.contentWidthInDots * dotSize - paddingX * 2,
  };

  return (
    <>
      {measurer}
      <Portal onDismiss={onClose}>
        <View style={[styles.bubble, origin, { width: shape.widthInDots * dotSize, height: shape.heightInDots * dotSize }]} pointerEvents="none">
          <Canvas style={StyleSheet.absoluteFill}>
            <DotCells cells={shape.cells} dotSize={dotSize} colors={BUBBLE_COLORS} />
          </Canvas>
          <Text style={[textStyle, styles.bubbleText, textBoxStyle]}>{text}</Text>
        </View>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  text: {
    color: COLORS.text.primary,
  },
  measurer: {
    position: 'absolute',
    alignItems: 'flex-start',
    opacity: 0,
  },
  bubble: {
    position: 'absolute',
  },
  bubbleText: {
    position: 'absolute',
  },
});
