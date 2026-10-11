import { type LayoutRectangle } from 'react-native';

import { bubbleLayout, type BubbleArrowAlign, type BubbleArrowDirection, MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS } from '@/shared/ui/dot-shape';

/** 화살표 끝과 `anchor` 사이 간격 (dot) */
const ANCHOR_GAP_IN_DOTS = 2;

type BubbleArrow = {
  arrowDirection: BubbleArrowDirection;
  arrowAlign: BubbleArrowAlign;
};

type BubbleOriginOptions = BubbleArrow & {
  contentWidthInDots: number;
  contentHeightInDots: number;
  /** 툴팁이 가리키는 요소 영역 */
  anchor: LayoutRectangle;
  /** 도트 한 변 (px) */
  dotSize: number;
};

/**
 * 화살표 끝을 `anchor` 변 중앙에 맞춘 말풍선 위치
 *
 * @returns 말풍선 좌상단 좌표. `anchor`와 같은 좌표계
 */
export const bubbleOrigin = ({ anchor, dotSize, ...bubble }: BubbleOriginOptions): { left: number; top: number } => {
  const { arrowTipColumn, arrowTipRow } = bubbleLayout(bubble);
  const gap = ANCHOR_GAP_IN_DOTS * dotSize;
  const tipX = arrowTipColumn * dotSize;
  const tipY = arrowTipRow * dotSize;
  // 화살표 끝 도트 중심을 `anchor` 중심에 정렬
  const centeredLeft = anchor.x + anchor.width / 2 - tipX - dotSize / 2;
  const centeredTop = anchor.y + anchor.height / 2 - tipY - dotSize / 2;

  return {
    up: { left: centeredLeft, top: anchor.y + anchor.height + gap - tipY },
    down: { left: centeredLeft, top: anchor.y - gap - dotSize - tipY },
    left: { left: anchor.x + anchor.width + gap - tipX, top: centeredTop },
    right: { left: anchor.x - gap - dotSize - tipX, top: centeredTop },
  }[bubble.arrowDirection];
};

type MaxContentWidthOptions = BubbleArrow & {
  anchor: LayoutRectangle;
  dotSize: number;
  /** 말풍선 허용 가로 범위. `anchor`와 같은 좌표계 */
  minLeft: number;
  maxRight: number;
  /** 화살표/테두리 포함 말풍선 최대 너비 (px) */
  maxWidth?: number;
};

/**
 * 가로 범위와 `maxWidth`를 넘지 않는 최대 콘텐츠 너비
 *
 * @returns 콘텐츠 너비 (dot). 최소 너비도 범위를 넘으면 `MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS`
 */
export const maxContentWidthInDots = ({ anchor, dotSize, minLeft, maxRight, maxWidth = Infinity, ...arrow }: MaxContentWidthOptions): number => {
  const fits = (contentWidthInDots: number): boolean => {
    // 가로 좌표는 콘텐츠 높이와 무관해 높이 0으로 계산
    const bubble = { ...arrow, contentWidthInDots, contentHeightInDots: 0 };
    const width = bubbleLayout(bubble).widthInDots * dotSize;
    const { left } = bubbleOrigin({ ...bubble, anchor, dotSize });

    return width <= maxWidth && minLeft <= left && left + width <= maxRight;
  };

  const rangeWidthInDots = Math.floor((maxRight - minLeft) / dotSize);

  // 범위가 무한하거나 `dotSize`가 0이면 아래 반복이 끝나지 않아 최소 너비로 처리
  if (!Number.isFinite(rangeWidthInDots)) return MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS;

  for (let contentWidthInDots = rangeWidthInDots; contentWidthInDots > MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS; contentWidthInDots -= 1) {
    if (fits(contentWidthInDots)) return contentWidthInDots;
  }

  return MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS;
};
