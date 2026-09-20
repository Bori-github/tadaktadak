/** 지원 최소 짧은 변, 배율 계산 단위 (px) */
export const MIN_SHORT_SIDE = 338;

/** medium 등급이 시작하는 짧은 변(px) */
export const MEDIUM_MIN_SHORT_SIDE = 360;

/** 배율 1에서 도트 한 변. 논리 픽셀 */
export const DOT_SIZE = 2;

export type ScreenGrade = 'compact' | 'medium' | 'expanded' | 'large';

export type BonfireHeightInDots = 7 | 9;

type ScreenGradeSpec = {
  minShortSide: number;
  scale: number;
  bonfireHeightInDots: BonfireHeightInDots;
};

/** `DESIGN.md` §7 구간별 처리 */
export const SCREEN_GRADES: Record<ScreenGrade, ScreenGradeSpec> = {
  compact: { minShortSide: MIN_SHORT_SIDE, scale: 1, bonfireHeightInDots: 7 },
  medium: { minShortSide: MEDIUM_MIN_SHORT_SIDE, scale: 1, bonfireHeightInDots: 9 },
  expanded: { minShortSide: MIN_SHORT_SIDE * 2, scale: 2, bonfireHeightInDots: 9 },
  large: { minShortSide: MIN_SHORT_SIDE * 3, scale: 3, bonfireHeightInDots: 9 },
};

/** 조작 버튼 한 변 (dot). 피그마 `button-enabled` */
export const BUTTON_SIZE_IN_DOTS = 28;

/** 원 버튼 지름 (dot). 피그마 `button-notification-settings`, `button-settings` */
export const ROUND_BUTTON_DIAMETER_IN_DOTS = 24;

/** 터치 영역이 버튼보다 큰 만큼 (논리 픽셀). `DESIGN.md` §4 */
export const BUTTON_TOUCH_PADDING = 8;
