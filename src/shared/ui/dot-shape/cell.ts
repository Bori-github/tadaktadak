/** 도트 하나가 맡는 색 역할 */
export type DotRole = 'edge' | 'highlight' | 'shadow' | 'face';

/** 같은 색 역할로 칠하는 사각형 하나 */
export type DotCell = { key: string; column: number; row: number; widthInDots: number; heightInDots: number; role: DotRole };

type RowRunOptions = {
  widthInDots: number;
  heightInDots: number;
  /** 그리지 않는 도트는 `null` */
  roleAt: (column: number, row: number) => DotRole | null;
};

/**
 * 행마다 같은 역할이 연속된 도트를 사각형 하나로 병합해 사각형 수를 줄임
 *
 * @returns 행 단위로 병합한 사각형
 */
export const rowRunCells = ({ widthInDots, heightInDots, roleAt }: RowRunOptions): DotCell[] => {
  const cells: DotCell[] = [];

  for (let row = 0; row < heightInDots; row += 1) {
    let run: DotCell | null = null;

    for (let column = 0; column < widthInDots; column += 1) {
      const role = roleAt(column, row);

      if (role === null) {
        run = null;
        continue;
      }

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
