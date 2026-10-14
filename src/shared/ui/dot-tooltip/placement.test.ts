import { describe, expect, it } from '@jest/globals';

import { bubbleLayout, type BubbleArrowAlign, type BubbleArrowDirection, MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS } from '@/shared/ui/dot-shape';

import { bubbleOrigin, maxContentWidthInDots } from './placement';

const DOT_SIZE = 3;
const GAP = 2 * DOT_SIZE;
const ANCHOR_SIZE = 44;
const CONTENT_HEIGHT_IN_DOTS = 12;
const RANGE = { minLeft: 16, maxRight: 374 };

const anchorAt = (x: number) => ({ x, y: 300, width: ANCHOR_SIZE, height: ANCHOR_SIZE });

const horizontalEdges = (arrowDirection: BubbleArrowDirection, arrowAlign: BubbleArrowAlign, anchorX: number, contentWidthInDots: number) => {
  const bubble = { arrowDirection, arrowAlign, contentWidthInDots, contentHeightInDots: CONTENT_HEIGHT_IN_DOTS };
  const { left } = bubbleOrigin({ ...bubble, anchor: anchorAt(anchorX), dotSize: DOT_SIZE });

  return { left, right: left + bubbleLayout(bubble).widthInDots * DOT_SIZE };
};

const DIRECTION_LABELS: Record<BubbleArrowDirection, string> = { up: '위', down: '아래', left: '왼쪽', right: '오른쪽' };
const ALIGN_LABELS: Record<BubbleArrowAlign, string> = { start: '시작', center: '가운데', end: '끝' };

const isInRange = ({ left, right }: { left: number; right: number }) => RANGE.minLeft <= left && right <= RANGE.maxRight;

describe('화살표 끝을 `anchor` 변 중앙에 맞춘 말풍선 위치', () => {
  const anchor = anchorAt(100);

  const arrowTipOf = (arrowDirection: BubbleArrowDirection) => {
    const bubble = { arrowDirection, arrowAlign: 'center', contentWidthInDots: 30, contentHeightInDots: CONTENT_HEIGHT_IN_DOTS } as const;
    const { left, top } = bubbleOrigin({ ...bubble, anchor, dotSize: DOT_SIZE });
    const { arrowTipColumn, arrowTipRow } = bubbleLayout(bubble);
    const tipLeft = left + arrowTipColumn * DOT_SIZE;
    const tipTop = top + arrowTipRow * DOT_SIZE;

    return { left: tipLeft, right: tipLeft + DOT_SIZE, top: tipTop, bottom: tipTop + DOT_SIZE, centerX: tipLeft + DOT_SIZE / 2, centerY: tipTop + DOT_SIZE / 2 };
  };

  it.each([
    { label: DIRECTION_LABELS.up, arrowDirection: 'up', gap: arrowTipOf('up').top - (anchor.y + anchor.height), center: arrowTipOf('up').centerX - (anchor.x + anchor.width / 2) },
    { label: DIRECTION_LABELS.down, arrowDirection: 'down', gap: anchor.y - arrowTipOf('down').bottom, center: arrowTipOf('down').centerX - (anchor.x + anchor.width / 2) },
    {
      label: DIRECTION_LABELS.left,
      arrowDirection: 'left',
      gap: arrowTipOf('left').left - (anchor.x + anchor.width),
      center: arrowTipOf('left').centerY - (anchor.y + anchor.height / 2),
    },
    { label: DIRECTION_LABELS.right, arrowDirection: 'right', gap: anchor.x - arrowTipOf('right').right, center: arrowTipOf('right').centerY - (anchor.y + anchor.height / 2) },
  ])('$label 화살표 끝은 요소 변 가운데에서 2도트 떨어진다', ({ gap, center }) => {
    expect({ gap, center }).toEqual({ gap: GAP, center: 0 });
  });
});

describe('가로 범위와 `maxWidth`를 넘지 않는 최대 콘텐츠 너비', () => {
  const directions: BubbleArrowDirection[] = ['up', 'down', 'left', 'right'];
  const aligns: BubbleArrowAlign[] = ['start', 'center', 'end'];
  const anchors = [
    { label: '범위 왼쪽 끝', anchorX: RANGE.minLeft },
    { label: '범위 가운데', anchorX: (RANGE.minLeft + RANGE.maxRight - ANCHOR_SIZE) / 2 },
    { label: '범위 오른쪽 끝', anchorX: RANGE.maxRight - ANCHOR_SIZE },
  ];
  const cases = directions.flatMap((arrowDirection) =>
    aligns.flatMap((arrowAlign) =>
      anchors.map(({ label, anchorX }) => ({
        label: `${DIRECTION_LABELS[arrowDirection]} 화살표·${ALIGN_LABELS[arrowAlign]} 정렬, ${label} 요소`,
        arrowDirection,
        arrowAlign,
        anchorX,
      })),
    ),
  );

  const widthAt = (arrowDirection: BubbleArrowDirection, arrowAlign: BubbleArrowAlign, anchorX: number, maxWidth?: number) =>
    maxContentWidthInDots({ arrowDirection, arrowAlign, anchor: anchorAt(anchorX), dotSize: DOT_SIZE, ...RANGE, maxWidth });

  const casesWithWidth = cases.map((row) => ({ ...row, width: widthAt(row.arrowDirection, row.arrowAlign, row.anchorX) }));

  it.each(casesWithWidth)('$label: 계산한 너비보다 1도트 넓은 말풍선은 범위를 벗어난다', ({ arrowDirection, arrowAlign, anchorX, width }) => {
    expect(isInRange(horizontalEdges(arrowDirection, arrowAlign, anchorX, width + 1))).toBe(false);
  });

  it.each(casesWithWidth.filter(({ width }) => width > MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS))(
    '$label: 최소보다 넓게 계산한 너비의 말풍선은 범위 안에 든다',
    ({ arrowDirection, arrowAlign, anchorX, width }) => {
      expect(isInRange(horizontalEdges(arrowDirection, arrowAlign, anchorX, width))).toBe(true);
    },
  );

  it.each([
    { label: DIRECTION_LABELS.up, arrowDirection: 'up' },
    { label: DIRECTION_LABELS.left, arrowDirection: 'left' },
  ] as const)('$label 화살표 말풍선 전체 너비가 maxWidth를 넘지 않는다', ({ arrowDirection }) => {
    const maxWidth = 150;
    const width = widthAt(arrowDirection, 'start', 150, maxWidth);
    const totalWidth = (contentWidthInDots: number) =>
      bubbleLayout({ arrowDirection, arrowAlign: 'start', contentWidthInDots, contentHeightInDots: CONTENT_HEIGHT_IN_DOTS }).widthInDots * DOT_SIZE;

    expect(totalWidth(width)).toBeLessThanOrEqual(maxWidth);
    expect(totalWidth(width + 1)).toBeGreaterThan(maxWidth);
  });

  it.each([
    { label: '오른쪽 끝이 무한', maxRight: Infinity, dotSize: DOT_SIZE },
    { label: '도트 크기가 0', maxRight: RANGE.maxRight, dotSize: 0 },
  ])('$label이면 최소 너비다', ({ maxRight, dotSize }) => {
    expect(maxContentWidthInDots({ arrowDirection: 'up', arrowAlign: 'start', anchor: anchorAt(150), dotSize, minLeft: RANGE.minLeft, maxRight })).toBe(
      MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS,
    );
  });

  it('가장 좁은 말풍선도 범위를 벗어나면 최소 너비다', () => {
    // 요소 왼쪽 공간이 범위 밖이라 최소 너비 말풍선도 넘침
    expect(widthAt('right', 'start', 0)).toBe(MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS);
  });
});
