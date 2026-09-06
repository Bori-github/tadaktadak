import { BUTTON_SIZE_IN_DOTS, BUTTON_TOUCH_PADDING } from '@/shared/constants';

/** 두 버튼 중심 간격 (dot). `DESIGN.md` §5 기준 화면에서 88px */
const GAP_IN_DOTS = 44;

export type ControlButton = 'play' | 'stop';

/**
 * 조작 버튼 둘의 가로 중심
 *
 * @param centerX - 화면 가로 중심 (px)
 * @param dotSize - 도트 한 변 (px)
 * @returns 버튼별 가로 중심 (px)
 */
export const buttonCentersX = (centerX: number, dotSize: number): Record<ControlButton, number> => {
  const offset = (GAP_IN_DOTS / 2) * dotSize;

  return { play: centerX - offset, stop: centerX + offset };
};

/**
 * 버튼 하나의 터치 영역 한 변. `DESIGN.md` §4
 *
 * @param dotSize - 도트 한 변 (px)
 * @returns 기준 화면에서 64가 되는 한 변 (px)
 */
export const buttonTouchSize = (dotSize: number): number => BUTTON_SIZE_IN_DOTS * dotSize + BUTTON_TOUCH_PADDING;
