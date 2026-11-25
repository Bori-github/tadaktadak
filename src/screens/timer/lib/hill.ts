import { gridDots, topLeftOnGrid, type ColoredDot } from '@/shared/lib';

/** 화면 하단에서 뒤 언덕 평균선까지 거리 (배율 1). 390×844 기준 */
const BASELINE_FROM_BOTTOM = 102;
/** 숫자 라벨 하단에서 뒤 언덕 평균선까지 최소 거리 (배율 1). 물결 진폭 22 + 간격 4 */
const BASELINE_BELOW_DIAL = 26;
const MIN_VISIBLE_HEIGHT = 30;
const FRONT_HILL_OFFSET = 42;
/** 뒤 언덕 윗변 기준 소나무 하단 y 오프셋 (배율 1) */
const PINE_SINK = 6;

/** 소나무 스프라이트. g 솔잎, s 눈, t 줄기. 피그마 `pine-big`, `pine-small` */
const PINE_BIG = ['....s....', '...sgs...', '..sgggs..', '...ggg...', '..sgggs..', '.sgggggs.', '..ggggg..', '.sgggggs.', 'sgggggggs', '.ggggggg.', '....t....', '....t....'];
const PINE_SMALL = ['...s...', '..sgs..', '.sgggs.', '..ggg..', '.sgggs.', 'sgggggs', '...t...'];
const PINE_COLORS: Record<string, string> = { g: '#102028', s: '#8fa2c4', t: '#1c1612' };
/** 소나무 중심 x (배율 1). 양수는 화면 왼쪽 끝, 음수는 오른쪽 끝 기준. 짝수 인덱스는 `PINE_BIG` */
const PINE_POSITIONS = [24, 44, 64, -90, -68, -42, -20];

/** 피그마 `snow-hill-strip` */
const BACK = { body: '#121a2e', rim: '#3e4c6c', shade: '#26324e' };
const FRONT = {
  body: '#36456a',
  litRim: '#c4d2ec',
  rim: '#8a9abc',
  litShade: '#8a9abc',
  shade: '#6474a0',
};
/** 앞 언덕 디더링. `column % every === at`인 열의 테두리 아래 `rows`행 */
const FRONT_DITHER = [
  { every: 2, at: 0, rows: 2, color: '#52618a' },
  { every: 2, at: 1, rows: 3, color: '#4c5b84' },
  { every: 4, at: 0, rows: 5, color: '#46557e' },
  { every: 4, at: 2, rows: 7, color: '#425079' },
];

type BaselineInput = {
  height: number;
  scale: number;
  dialBottomY: number;
};

/**
 * 뒤 언덕 평균선 y
 *
 * @param input - 화면 높이와 시계판 위치
 * @param input.height - 화면 높이 (px)
 * @param input.scale - 배율
 * @param input.dialBottomY - 숫자 라벨 하단 y (px)
 * @returns 평균선 y (px)
 */
export const hillBaseline = ({ height, scale, dialBottomY }: BaselineInput): number =>
  Math.min(Math.max(height - BASELINE_FROM_BOTTOM * scale, dialBottomY + BASELINE_BELOW_DIAL * scale), height - MIN_VISIBLE_HEIGHT * scale);

type HillInput = {
  width: number;
  height: number;
  scale: number;
  dotSize: number;
  baseline: number;
};

/**
 * 뒤 언덕, 소나무, 앞 언덕 도트
 *
 * @param input - 화면 크기와 평균선
 * @param input.width - 화면 너비 (px)
 * @param input.height - 화면 높이 (px)
 * @param input.scale - 배율
 * @param input.dotSize - 도트 한 변 (px)
 * @param input.baseline - `hillBaseline` 결과 (px)
 * @returns 화면 도트 격자 좌표의 도트. 좌표 중복 없음
 */
export const hillDots = ({ width, height, scale, dotSize, baseline }: HillInput): ColoredDot[] => {
  const columns = Math.ceil(width / dotSize);
  const bottomRow = Math.ceil(height / dotSize);
  const backTop = (x: number) => baseline + scale * (16 * Math.sin(x / (70 * scale) + 2) + 6 * Math.sin(x / (27 * scale)));
  const frontTop = (x: number) => baseline + FRONT_HILL_OFFSET * scale + scale * (12 * Math.sin(x / (55 * scale)) + 5 * Math.sin(x / (19 * scale) + 1));
  const toRow = (y: number) => Math.round(y / dotSize);

  // 같은 좌표는 마지막에 추가한 도트로 대체
  const dots = new Map<number, ColoredDot>();
  const put = (x: number, y: number, color: string) => {
    if (x < 0 || x >= columns || y >= bottomRow) return;
    dots.set(y * columns + x, { x, y, color });
  };
  const fillBelow = (column: number, row: number, color: string) => {
    for (let y = row; y < bottomRow; y += 1) put(column, y, color);
  };

  for (let column = 0; column < columns; column += 1) {
    const row = toRow(backTop(column * dotSize));
    fillBelow(column, row, BACK.body);
    put(column, row, BACK.rim);
    if ((column + row) % 2 === 0) put(column, row + 1, BACK.shade);
  }

  PINE_POSITIONS.forEach((position, index) => {
    const grid = index % 2 === 0 ? PINE_BIG : PINE_SMALL;
    const centerX = position >= 0 ? position * scale : width + position * scale;
    const bottom = backTop(centerX) + PINE_SINK * scale;
    const { left, top } = topLeftOnGrid({ centerX, centerY: bottom - (grid.length * dotSize) / 2, widthInDots: grid[0]?.length ?? 0, heightInDots: grid.length, dotSize });
    gridDots(grid, PINE_COLORS, left, top).forEach(({ x, y, color }) => put(x, y, color));
  });

  for (let column = 0; column < columns; column += 1) {
    const x = column * dotSize;
    const row = toRow(frontTop(x));
    // 광원이 왼쪽 위라서 오른쪽 상승 구간을 밝은 색으로 표시
    const isLit = frontTop(x + dotSize) < frontTop(x - dotSize);
    fillBelow(column, row, FRONT.body);
    put(column, row, isLit ? FRONT.litRim : FRONT.rim);
    put(column, row + 1, isLit ? FRONT.litShade : FRONT.shade);
    FRONT_DITHER.filter(({ every, at }) => column % every === at).forEach(({ rows, color }) => put(column, row + rows, color));
  }

  return [...dots.values()];
};
