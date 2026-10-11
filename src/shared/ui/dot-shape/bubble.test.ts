import { describe, expect, it } from '@jest/globals';

import { type BubbleArrowAlign, type BubbleArrowDirection, bubbleShape } from './bubble';
import { type DotRole } from './cell';

// 너비와 높이가 뒤바뀌면 드러나도록 다른 값
const WIDTH = 64;
const HEIGHT = 20;

const shapeOf = (arrowDirection: BubbleArrowDirection, arrowAlign: BubbleArrowAlign) =>
  bubbleShape({ contentWidthInDots: WIDTH, contentHeightInDots: HEIGHT, arrowDirection, arrowAlign });

const roleAt = (shape: ReturnType<typeof bubbleShape>, column: number, row: number): DotRole | undefined =>
  shape.cells.find((cell) => cell.column <= column && column < cell.column + cell.widthInDots && cell.row === row)?.role;

describe('도트 말풍선', () => {
  it('화살표 끝은 콘텐츠에서 4도트 떨어진 테두리 도트 하나다', () => {
    const shape = shapeOf('up', 'start');

    expect([5, 6, 7].map((column) => roleAt(shape, column, 0))).toEqual([undefined, 'edge', undefined]);
  });

  it('화살표가 붙는 콘텐츠 둘레에는 테두리가 없다', () => {
    const shape = shapeOf('up', 'start');

    expect(roleAt(shape, 7, shape.contentRow)).toBe('face');
    expect(roleAt(shape, 20, shape.contentRow)).toBe('edge');
  });

  it('end 정렬은 직각 변이 콘텐츠 끝 쪽에 온다', () => {
    const shape = shapeOf('up', 'end');
    const tipColumn = WIDTH - 1 - 6;

    expect([tipColumn - 1, tipColumn].map((column) => roleAt(shape, column, 0))).toEqual([undefined, 'edge']);
    expect(roleAt(shape, tipColumn - 3, 3)).toBe('edge');
  });

  it.each([
    { arrowDirection: 'up', widthInDots: WIDTH, heightInDots: HEIGHT + 5, contentColumn: 0, contentRow: 4 },
    { arrowDirection: 'down', widthInDots: WIDTH, heightInDots: HEIGHT + 5, contentColumn: 0, contentRow: 0 },
    { arrowDirection: 'left', widthInDots: WIDTH + 4, heightInDots: HEIGHT + 1, contentColumn: 4, contentRow: 0 },
    { arrowDirection: 'right', widthInDots: WIDTH + 4, heightInDots: HEIGHT + 1, contentColumn: 0, contentRow: 0 },
  ] as const)('$arrowDirection 화살표는 그 방향으로 전체 크기를 늘린다', ({ arrowDirection, ...expected }) => {
    const { widthInDots, heightInDots, contentColumn, contentRow } = shapeOf(arrowDirection, 'center');

    expect({ widthInDots, heightInDots, contentColumn, contentRow }).toEqual(expected);
  });

  it.each([
    { arrowDirection: 'up', arrowAlign: 'start', arrowTipColumn: 6, arrowTipRow: 0 },
    { arrowDirection: 'down', arrowAlign: 'end', arrowTipColumn: WIDTH - 1 - 6, arrowTipRow: HEIGHT + 3 },
    { arrowDirection: 'left', arrowAlign: 'start', arrowTipColumn: 0, arrowTipRow: 4 },
    { arrowDirection: 'right', arrowAlign: 'end', arrowTipColumn: WIDTH + 3, arrowTipRow: HEIGHT - 1 - 4 },
    { arrowDirection: 'left', arrowAlign: 'center', arrowTipColumn: 0, arrowTipRow: HEIGHT / 2 - 2 },
  ] as const)('$arrowDirection·$arrowAlign 화살표 끝 도트 좌표를 반환한다', ({ arrowDirection, arrowAlign, ...expected }) => {
    const shape = shapeOf(arrowDirection, arrowAlign);

    expect({ arrowTipColumn: shape.arrowTipColumn, arrowTipRow: shape.arrowTipRow }).toEqual(expected);
    expect(roleAt(shape, shape.arrowTipColumn, shape.arrowTipRow)).toBe('edge');
  });

  it('콘텐츠 바로 아래 행은 그림자다', () => {
    const shape = shapeOf('up', 'start');

    expect(roleAt(shape, WIDTH / 2, shape.contentRow + HEIGHT)).toBe('shadow');
  });

  it('모서리는 3·1·1도트씩 들어간다', () => {
    const shape = shapeOf('down', 'center');
    const firstColumns = [0, 1, 2, 3].map((row) => shape.cells.find((cell) => cell.row === row)?.column);

    expect(firstColumns).toEqual([3, 1, 1, 0]);
  });
});
