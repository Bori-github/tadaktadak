import { describe, expect, it } from '@jest/globals';

import { circleCells, type DotRole } from './circle';

const DIAMETER = 24;

const cells = circleCells(DIAMETER);

const byRow = Array.from({ length: DIAMETER }, (_, row) => cells.filter((cell) => cell.row === row).sort((first, second) => first.column - second.column));

describe('도트 원', () => {
  it('가장 넓은 줄이 지름만큼 찬다', () => {
    const widths = byRow.map((row) => row.reduce((sum, cell) => sum + cell.widthInDots, 0));

    expect(Math.max(...widths)).toBe(DIAMETER);
  });

  it('줄마다 양 끝은 테두리다', () => {
    const ends = byRow.map((row) => [row.at(0)?.role, row.at(-1)?.role]);

    expect(ends.every(([first, last]) => first === 'edge' && last === 'edge')).toBe(true);
  });

  it('한 줄 안에 빈틈이 없다', () => {
    const gaps = byRow.flatMap((row) =>
      row.filter((cell, index) => {
        const previous = row[index - 1];

        return previous !== undefined && previous.column + previous.widthInDots !== cell.column;
      }),
    );

    expect(gaps).toEqual([]);
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
