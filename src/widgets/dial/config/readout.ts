import { dotNumberSize } from '@/shared/ui/dot-number';

/** 집중 숫자 배율. 5×7 자형이 21 도트. `DESIGN.md` §3 */
export const FOCUS_GLYPH_SCALE = 3;

/** 두 숫자 사이 (dot). `DESIGN.md` §5 */
const GAP_IN_DOTS = 10;

/** 글자 상자 바깥 터치 여백 (논리 픽셀). `DESIGN.md` §4 조작 버튼과 같은 값 */
export const TOUCH_MARGIN = 8;

const CLOCK_SAMPLE = '00:00';

export const FOCUS_SIZE = dotNumberSize(CLOCK_SAMPLE, FOCUS_GLYPH_SCALE);
export const REST_SIZE = dotNumberSize(CLOCK_SAMPLE);

/** 집중 숫자 중심에서 휴식 숫자 중심까지 (dot) */
export const REST_OFFSET_IN_DOTS = FOCUS_SIZE.heightInDots / 2 + GAP_IN_DOTS + REST_SIZE.heightInDots / 2;
