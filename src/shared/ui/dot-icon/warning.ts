import { type RectIcon } from './types';

/** 피그마 `icon-warning`. 좌우 대칭을 위해 x가 2px 격자에서 1px 어긋나 좌표로 그림 */
export const WARNING_ICON: RectIcon = {
  boxSize: 24,
  rects: [
    [11, 4, 2, 2],
    [9, 6, 6, 2],
    [9, 8, 2, 2],
    [13, 8, 2, 2],
    [7, 10, 4, 4],
    [13, 10, 4, 4],
    [5, 14, 14, 2],
    [5, 16, 6, 2],
    [13, 16, 6, 2],
    [3, 18, 18, 2],
  ],
};
