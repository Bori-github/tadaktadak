import { type DotRole } from './circle';

/** 리벳이 놓이는 모서리 안쪽 거리 (dot) */
const RIVET_INSET = 3;

export type RectangleCell = { key: string; column: number; row: number; widthInDots: number; heightInDots: number; role: DotRole };

type RectangleSize = {
  widthInDots: number;
  heightInDots: number;
};

/**
 * 도트로 그리는 사각형. 피그마 `button-enabled`
 *
 * @returns 그리는 순서대로 놓인 사각형과 색 역할
 */
export const rectangleCells = ({ widthInDots, heightInDots }: RectangleSize): RectangleCell[] => {
  const right = widthInDots - 1;
  const bottom = heightInDots - 1;

  const cells: RectangleCell[] = [
    { key: 'face', column: 0, row: 0, widthInDots, heightInDots, role: 'face' },
    { key: 'edge-top', column: 0, row: 0, widthInDots, heightInDots: 1, role: 'edge' },
    { key: 'edge-bottom', column: 0, row: bottom, widthInDots, heightInDots: 1, role: 'edge' },
    { key: 'edge-left', column: 0, row: 0, widthInDots: 1, heightInDots, role: 'edge' },
    { key: 'edge-right', column: right, row: 0, widthInDots: 1, heightInDots, role: 'edge' },
    { key: 'highlight-top', column: 1, row: 1, widthInDots: widthInDots - 2, heightInDots: 1, role: 'highlight' },
    { key: 'highlight-left', column: 1, row: 1, widthInDots: 1, heightInDots: heightInDots - 2, role: 'highlight' },
    // 하이라이트와 겹치는 도트 두 칸 (1, bottom - 1)·(right - 1, 1)은 나중에 그리는 그림자 색
    { key: 'shadow-bottom', column: 1, row: bottom - 1, widthInDots: widthInDots - 2, heightInDots: 1, role: 'shadow' },
    { key: 'shadow-right', column: right - 1, row: 1, widthInDots: 1, heightInDots: heightInDots - 2, role: 'shadow' },
  ];

  for (const [column, row] of [
    [RIVET_INSET, RIVET_INSET],
    [right - RIVET_INSET, RIVET_INSET],
    [RIVET_INSET, bottom - RIVET_INSET],
    [right - RIVET_INSET, bottom - RIVET_INSET],
  ] as const) {
    cells.push({ key: `rivet-${column}-${row}`, column, row, widthInDots: 1, heightInDots: 1, role: 'edge' });
  }

  return cells;
};
