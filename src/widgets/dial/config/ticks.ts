/** 시계판 눈금 수. 1분에 한 칸. `DESIGN.md` §5 */
export const TICKS = 60;

/** 12시 다음이 1인 눈금 번호 */
export const TICK_NUMBERS = Array.from({ length: TICKS }, (_, index) => index + 1);
