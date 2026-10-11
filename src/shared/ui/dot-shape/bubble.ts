import { type DotCell, type DotRole, rowRunCells } from './cell';

export type BubbleArrowDirection = 'up' | 'down' | 'left' | 'right';

export type BubbleArrowAlign = 'start' | 'center' | 'end';

const ARROW_LENGTH_IN_DOTS = 4;

/** 콘텐츠 상단/하단 행부터 적용하는 모서리 들여쓰기 (dot) */
const CORNER_INSETS = [3, 1, 1];

/** `start`/`end` 정렬 화살표 직각 변과 콘텐츠 끝 사이 오프셋 (dot) */
const ARROW_EDGE_OFFSET_IN_DOTS = { horizontal: 6, vertical: 4 };

/** `start`/`end` 정렬 화살표 밑변이 같은 열에 놓이는 콘텐츠 너비 (dot). 더 좁으면 두 정렬 위치가 뒤바뀜 */
export const MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS = ARROW_EDGE_OFFSET_IN_DOTS.horizontal * 2 + ARROW_LENGTH_IN_DOTS;

/** 왼쪽/오른쪽 화살표에서 `start`/`end` 밑변이 같은 행에 놓이는 콘텐츠 높이 (dot). 더 낮으면 두 정렬 위치가 뒤바뀜 */
export const MIN_BUBBLE_CONTENT_HEIGHT_IN_DOTS = ARROW_EDGE_OFFSET_IN_DOTS.vertical * 2 + ARROW_LENGTH_IN_DOTS;

type BubbleOptions = {
  /** 화살표 제외 콘텐츠 크기 (dot) */
  contentWidthInDots: number;
  contentHeightInDots: number;
  arrowDirection: BubbleArrowDirection;
  arrowAlign: BubbleArrowAlign;
};

type BubbleLayout = {
  /** 정수로 올림하고 최소 크기를 적용한 콘텐츠 크기 (dot) */
  contentWidthInDots: number;
  contentHeightInDots: number;
  /** 화살표/하단 그림자 행 포함 전체 크기 (dot) */
  widthInDots: number;
  heightInDots: number;
  /** 콘텐츠 좌상단 도트 좌표 */
  contentColumn: number;
  contentRow: number;
  /** 화살표 끝 도트 좌표 */
  arrowTipColumn: number;
  arrowTipRow: number;
};

type BubbleShape = BubbleLayout & {
  cells: DotCell[];
};

// 콘텐츠 길이가 무한하면 `rowRunCells` 반복이 끝나지 않고, `NaN`이면 사각형이 만들어지지 않아 최소값으로 처리
const toDrawableLength = (lengthInDots: number, minInDots: number): number => (Number.isFinite(lengthInDots) ? Math.max(minInDots, Math.ceil(lengthInDots)) : minInDots);

const toDrawableContentSize = (options: BubbleOptions): BubbleOptions => ({
  ...options,
  contentWidthInDots: toDrawableLength(options.contentWidthInDots, MIN_BUBBLE_CONTENT_WIDTH_IN_DOTS),
  contentHeightInDots: toDrawableLength(options.contentHeightInDots, MIN_BUBBLE_CONTENT_HEIGHT_IN_DOTS),
});

const isArrowVertical = (arrowDirection: BubbleArrowDirection): boolean => arrowDirection === 'up' || arrowDirection === 'down';

/** 콘텐츠 변 기준 화살표 직각 변의 오프셋 (dot). `end`는 빗변 방향을 반전해 직각 변을 콘텐츠 끝 쪽에 둠 */
const arrowStraightSide = ({ contentWidthInDots, contentHeightInDots, arrowDirection, arrowAlign }: BubbleOptions): number => {
  const edgeLength = isArrowVertical(arrowDirection) ? contentWidthInDots : contentHeightInDots;
  const edgeOffset = isArrowVertical(arrowDirection) ? ARROW_EDGE_OFFSET_IN_DOTS.horizontal : ARROW_EDGE_OFFSET_IN_DOTS.vertical;

  return { start: edgeOffset, center: Math.floor(edgeLength / 2) - ARROW_LENGTH_IN_DOTS / 2, end: edgeLength - 1 - edgeOffset }[arrowAlign];
};

/**
 * `bubbleShape`에서 사각형 계산을 뺀 크기/좌표 계산
 *
 * @returns 콘텐츠/전체 크기, 콘텐츠/화살표 끝 도트 좌표
 */
export const bubbleLayout = (requested: BubbleOptions): BubbleLayout => {
  const options = toDrawableContentSize(requested);
  const { contentWidthInDots, contentHeightInDots, arrowDirection } = options;
  const contentColumn = arrowDirection === 'left' ? ARROW_LENGTH_IN_DOTS : 0;
  const contentRow = arrowDirection === 'up' ? ARROW_LENGTH_IN_DOTS : 0;
  const outlineWidth = isArrowVertical(arrowDirection) ? contentWidthInDots : contentWidthInDots + ARROW_LENGTH_IN_DOTS;
  const outlineHeight = isArrowVertical(arrowDirection) ? contentHeightInDots + ARROW_LENGTH_IN_DOTS : contentHeightInDots;
  const straightSide = arrowStraightSide(options);

  const arrowTip = {
    up: { column: contentColumn + straightSide, row: 0 },
    down: { column: contentColumn + straightSide, row: outlineHeight - 1 },
    left: { column: 0, row: contentRow + straightSide },
    right: { column: outlineWidth - 1, row: contentRow + straightSide },
  }[arrowDirection];

  return {
    contentWidthInDots,
    contentHeightInDots,
    widthInDots: outlineWidth,
    // 하단 그림자 1행 포함
    heightInDots: outlineHeight + 1,
    contentColumn,
    contentRow,
    arrowTipColumn: arrowTip.column,
    arrowTipRow: arrowTip.row,
  };
};

/**
 * 도트 말풍선. 콘텐츠와 화살표를 단일 영역으로 합쳐 외곽선만 테두리로 처리해 연결부에 테두리 없음
 *
 * @returns 행 단위로 병합한 사각형, 콘텐츠/전체 크기, 콘텐츠/화살표 끝 도트 좌표
 */
export const bubbleShape = (requested: BubbleOptions): BubbleShape => {
  const { arrowDirection, arrowAlign } = requested;
  const layout = bubbleLayout(requested);
  const { contentWidthInDots, contentHeightInDots, contentColumn, contentRow } = layout;

  const isInContent = (column: number, row: number): boolean => {
    const localColumn = column - contentColumn;
    const localRow = row - contentRow;

    if (localRow < 0 || localRow >= contentHeightInDots) return false;

    const inset = CORNER_INSETS[Math.min(localRow, contentHeightInDots - 1 - localRow)] ?? 0;

    return inset <= localColumn && localColumn < contentWidthInDots - inset;
  };

  // 화살표가 붙는 변 기준 좌표. along: 변 방향 위치, depth: 변 바깥 방향 거리
  const toArrowAxis = (column: number, row: number): { along: number; depth: number } =>
    ({
      up: { along: column - contentColumn, depth: contentRow - row },
      down: { along: column - contentColumn, depth: row - (contentRow + contentHeightInDots - 1) },
      left: { along: row - contentRow, depth: contentColumn - column },
      right: { along: row - contentRow, depth: column - (contentColumn + contentWidthInDots - 1) },
    })[arrowDirection];

  const straightSide = arrowStraightSide({ contentWidthInDots, contentHeightInDots, arrowDirection, arrowAlign });
  const slantStep = arrowAlign === 'end' ? -1 : 1;

  const isInArrow = (column: number, row: number): boolean => {
    const { along, depth } = toArrowAxis(column, row);

    if (depth < 1 || depth > ARROW_LENGTH_IN_DOTS) return false;

    const offsetFromStraightSide = (along - straightSide) * slantStep;

    return 0 <= offsetFromStraightSide && offsetFromStraightSide <= ARROW_LENGTH_IN_DOTS - depth;
  };

  const isFilled = (column: number, row: number): boolean => isInContent(column, row) || isInArrow(column, row);

  const roleAt = (column: number, row: number): DotRole | null => {
    if (!isFilled(column, row)) return isFilled(column, row - 1) ? 'shadow' : null;

    const isInner = isFilled(column - 1, row) && isFilled(column + 1, row) && isFilled(column, row - 1) && isFilled(column, row + 1);

    return isInner ? 'face' : 'edge';
  };

  return { ...layout, cells: rowRunCells({ widthInDots: layout.widthInDots, heightInDots: layout.heightInDots, roleAt }) };
};
