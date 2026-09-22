/** 도트 하나가 맡는 색 역할 */
export type DotRole = 'edge' | 'highlight' | 'shadow' | 'face';

/** 같은 색 역할로 칠하는 사각형 하나 */
export type DotCell = { key: string; column: number; row: number; widthInDots: number; heightInDots: number; role: DotRole };
