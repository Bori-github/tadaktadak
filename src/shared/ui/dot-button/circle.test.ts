import { describe, expect, it } from '@jest/globals';

import { circleCells, type DotRole } from './circle';

const DIAMETER = 24;

const cells = circleCells(DIAMETER);

const byRow = Array.from({ length: DIAMETER }, (_, row) => cells.filter((cell) => cell.row === row).sort((first, second) => first.column - second.column));

// 구간은 가로로 묶여 있어 한 열을 보려면 그 열을 지나는 구간을 모음
const byColumn = Array.from({ length: DIAMETER }, (_, column) =>
  cells.filter((cell) => cell.column <= column && column < cell.column + cell.widthInDots).sort((first, second) => first.row - second.row),
);

describe('도트 원', () => {
  it('가장 넓은 줄이 지름만큼 찬다', () => {
    const widths = byRow.map((row) => row.reduce((sum, cell) => sum + cell.widthInDots, 0));

    expect(Math.max(...widths)).toBe(DIAMETER);
  });

  it('줄마다 양 끝은 테두리다', () => {
    const ends = byRow.map((row) => [row.at(0)?.role, row.at(-1)?.role]);

    expect(ends.every(([first, last]) => first === 'edge' && last === 'edge')).toBe(true);
  });

  it('열마다 양 끝은 테두리다', () => {
    const notEdge = byColumn.filter((column) => column.at(0)?.role !== 'edge' || column.at(-1)?.role !== 'edge');

    expect(notEdge).toEqual([]);
  });

  it('0행 0열에서 시작해 지름을 다 쓴다', () => {
    expect({
      left: Math.min(...cells.map((cell) => cell.column)),
      top: Math.min(...cells.map((cell) => cell.row)),
      right: Math.max(...cells.map((cell) => cell.column + cell.widthInDots)),
      bottom: Math.max(...cells.map((cell) => cell.row)) + 1,
    }).toEqual({ left: 0, top: 0, right: DIAMETER, bottom: DIAMETER });
  });

  it('같은 역할이 이어지면 한 칸으로 묶인다', () => {
    const unmerged = byRow.flatMap((row) => row.filter((cell, index) => row[index - 1]?.role === cell.role));

    expect(unmerged).toEqual([]);
  });

  it('하이라이트가 그림자보다 위·왼쪽에 있다', () => {
    const spot = (role: DotRole) => {
      const picked = cells.filter((cell) => cell.role === role);
      const dots = picked.reduce((sum, cell) => sum + cell.widthInDots, 0);

      return picked.reduce((sum, cell) => sum + (cell.column + cell.widthInDots / 2 + cell.row) * cell.widthInDots, 0) / dots;
    };

    expect(spot('highlight')).toBeLessThan(spot('shadow'));
  });
});
