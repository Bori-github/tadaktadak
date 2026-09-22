import { describe, expect, it } from '@jest/globals';

import { type DotRole } from './circle';
import { rectangleCells } from './rectangle';

// 너비와 높이가 뒤바뀌면 드러나도록 다른 값
const WIDTH = 30;
const HEIGHT = 20;

const cells = rectangleCells({ widthInDots: WIDTH, heightInDots: HEIGHT });

const roleAt = (column: number, row: number): DotRole | undefined =>
  cells.findLast((cell) => cell.column <= column && column < cell.column + cell.widthInDots && cell.row <= row && row < cell.row + cell.heightInDots)?.role;

describe('도트 사각형', () => {
  it('10행이 테두리·하이라이트·면·그림자·테두리 순이다', () => {
    expect([0, 1, 2, WIDTH - 3, WIDTH - 2, WIDTH - 1].map((column) => roleAt(column, 10))).toEqual(['edge', 'highlight', 'face', 'face', 'shadow', 'edge']);
  });

  it('15열이 테두리·하이라이트·면·그림자·테두리 순이다', () => {
    expect([0, 1, 2, HEIGHT - 3, HEIGHT - 2, HEIGHT - 1].map((row) => roleAt(15, row))).toEqual(['edge', 'highlight', 'face', 'face', 'shadow', 'edge']);
  });

  it.each([
    { column: 1, row: HEIGHT - 2 },
    { column: WIDTH - 2, row: 1 },
  ])('하이라이트와 그림자가 겹치는 ($column, $row)는 그림자다', ({ column, row }) => {
    expect(roleAt(column, row)).toBe('shadow');
  });

  it.each([
    { column: 3, row: 3 },
    { column: WIDTH - 4, row: 3 },
    { column: 3, row: HEIGHT - 4 },
    { column: WIDTH - 4, row: HEIGHT - 4 },
  ])('리벳 ($column, $row)는 테두리 색이다', ({ column, row }) => {
    expect(roleAt(column, row)).toBe('edge');
  });
});
