import { type DotCell, type DotRole } from './cell';

/**
 * 도트로 그리는 원. 피그마 `button-settings`
 *
 * @param diameterInDots - 지름 (dot)
 * @returns 줄마다 같은 역할이 이어지는 구간과 색 역할
 */
export const circleCells = (diameterInDots: number): DotCell[] => {
  const radius = diameterInDots / 2;

  const isFilled = (column: number, row: number): boolean => {
    if (column < 0 || column >= diameterInDots) return false;
    if (row < 0 || row >= diameterInDots) return false;

    const dx = column + 0.5 - radius;
    const dy = row + 0.5 - radius;

    return dx * dx + dy * dy <= radius * radius;
  };

  const roleAt = (column: number, row: number): DotRole => {
    const onEdge = !isFilled(column - 1, row) || !isFilled(column + 1, row) || !isFilled(column, row - 1) || !isFilled(column, row + 1);

    if (onEdge) return 'edge';

    // 두 칸 건너가 원 밖이면 테두리 바로 안쪽 줄
    // 조작 버튼이 하이라이트와 그림자를 두는 「안쪽 1 도트」와 같은 자리
    // 조작 버튼은 그림자를 하이라이트보다 나중에 그려 겹치는 자리가 그림자 색이 되므로, 그림자를 먼저 판단
    if (!isFilled(column + 2, row) || !isFilled(column, row + 2)) return 'shadow';
    if (!isFilled(column - 2, row) || !isFilled(column, row - 2)) return 'highlight';

    return 'face';
  };

  const cells: DotCell[] = [];

  for (let row = 0; row < diameterInDots; row += 1) {
    let run: DotCell | null = null;

    for (let column = 0; column < diameterInDots; column += 1) {
      if (!isFilled(column, row)) continue;

      const role = roleAt(column, row);

      // 같은 역할이 이어지면 폭만 늘려 그리는 사각형 수를 줄임
      if (run !== null && run.role === role) {
        run.widthInDots += 1;
        continue;
      }

      run = { key: `${column}-${row}`, column, row, widthInDots: 1, heightInDots: 1, role };
      cells.push(run);
    }
  }

  return cells;
};
