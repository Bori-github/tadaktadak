import { type DotCell, type DotRole, rowRunCells } from './cell';

export type BubbleArrowDirection = 'up' | 'down' | 'left' | 'right';

export type BubbleArrowAlign = 'start' | 'center' | 'end';

const ARROW_LENGTH_IN_DOTS = 4;

/** 콘텐츠 상단/하단 행부터 적용하는 모서리 들여쓰기 (dot) */
const CORNER_INSETS = [3, 1, 1];

/** `start`/`end` 정렬 화살표 직각 변과 콘텐츠 끝 사이 오프셋 (dot) */
const ARROW_EDGE_OFFSET_IN_DOTS = { horizontal: 6, vertical: 4 };

type BubbleOptions = {
  /** 화살표 제외 콘텐츠 크기 (dot) */
  contentWidthInDots: number;
  contentHeightInDots: number;
  arrowDirection: BubbleArrowDirection;
  arrowAlign: BubbleArrowAlign;
};

type BubbleShape = {
  cells: DotCell[];
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

/**
 * 도트 말풍선. 콘텐츠와 화살표를 단일 영역으로 합쳐 외곽선만 테두리로 처리해 연결부에 테두리 없음
 *
 * @returns 행 단위로 병합한 사각형, 전체 크기, 콘텐츠/화살표 끝 도트 좌표
 */
export const bubbleShape = ({ contentWidthInDots, contentHeightInDots, arrowDirection, arrowAlign }: BubbleOptions): BubbleShape => {
  const isArrowVertical = arrowDirection === 'up' || arrowDirection === 'down';
  const contentColumn = arrowDirection === 'left' ? ARROW_LENGTH_IN_DOTS : 0;
  const contentRow = arrowDirection === 'up' ? ARROW_LENGTH_IN_DOTS : 0;
  const outlineWidth = isArrowVertical ? contentWidthInDots : contentWidthInDots + ARROW_LENGTH_IN_DOTS;
  const outlineHeight = isArrowVertical ? contentHeightInDots + ARROW_LENGTH_IN_DOTS : contentHeightInDots;

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

  const edgeLength = isArrowVertical ? contentWidthInDots : contentHeightInDots;
  const edgeOffset = isArrowVertical ? ARROW_EDGE_OFFSET_IN_DOTS.horizontal : ARROW_EDGE_OFFSET_IN_DOTS.vertical;
  // 직각 변 위치. `end`는 빗변 방향을 반전해 직각 변을 콘텐츠 끝 쪽에 둠
  const straightSide = { start: edgeOffset, center: Math.floor(edgeLength / 2) - ARROW_LENGTH_IN_DOTS / 2, end: edgeLength - 1 - edgeOffset }[arrowAlign];
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

  const arrowTip = {
    up: { column: contentColumn + straightSide, row: 0 },
    down: { column: contentColumn + straightSide, row: outlineHeight - 1 },
    left: { column: 0, row: contentRow + straightSide },
    right: { column: outlineWidth - 1, row: contentRow + straightSide },
  }[arrowDirection];

  return {
    // 하단 그림자 1행 포함
    cells: rowRunCells({ widthInDots: outlineWidth, heightInDots: outlineHeight + 1, roleAt }),
    widthInDots: outlineWidth,
    heightInDots: outlineHeight + 1,
    contentColumn,
    contentRow,
    arrowTipColumn: arrowTip.column,
    arrowTipRow: arrowTip.row,
  };
};
