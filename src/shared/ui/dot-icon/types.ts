/** 12 × 12 도트 격자. `I`가 찍는 자리, `.`은 비움 */
export type GridIcon = readonly string[];

/** 도트 격자에 맞지 않아 좌표로 그리는 자형. `boxSize`와 `rects` 모두 배율 1의 논리 픽셀 */
export type RectIcon = { boxSize: number; rects: readonly (readonly [number, number, number, number])[] };
