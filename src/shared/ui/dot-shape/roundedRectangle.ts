import { type DotCell, outlineCells } from './cell';

/** 상단/하단 행부터 적용하는 모서리 들여쓰기 (dot). 피그마 `tooltip`·`toast` */
const CORNER_INSETS = [3, 1, 1];

type RoundedRectangleSize = {
  widthInDots: number;
  heightInDots: number;
};

type RoundedRectanglePoint = RoundedRectangleSize & {
  column: number;
  row: number;
};

/**
 * 모서리를 들여쓴 사각형 안의 도트인지
 *
 * @returns 모서리 들여쓰기 밖이거나 사각형 밖이면 `false`
 */
export const isInRoundedRectangle = ({ column, row, widthInDots, heightInDots }: RoundedRectanglePoint): boolean => {
  if (row < 0 || row >= heightInDots) return false;

  const inset = CORNER_INSETS[Math.min(row, heightInDots - 1 - row)] ?? 0;

  return inset <= column && column < widthInDots - inset;
};

type RoundedRectangleShape = RoundedRectangleSize & {
  cells: DotCell[];
};

/**
 * 모서리를 들여쓴 도트 사각형. 피그마 `toast` 몸통
 *
 * @param size.widthInDots - 테두리 포함 너비 (dot)
 * @param size.heightInDots - 테두리 포함 높이 (dot). 하단 그림자 1행은 제외
 * @returns 행 단위로 병합한 사각형과 하단 그림자 1행을 더한 전체 크기 (dot)
 */
export const roundedRectangleShape = ({ widthInDots, heightInDots }: RoundedRectangleSize): RoundedRectangleShape => {
  const heightWithShadowInDots = heightInDots + 1;

  return {
    widthInDots,
    heightInDots: heightWithShadowInDots,
    cells: outlineCells({
      widthInDots,
      heightInDots: heightWithShadowInDots,
      isFilled: (column, row) => isInRoundedRectangle({ column, row, widthInDots, heightInDots }),
    }),
  };
};
