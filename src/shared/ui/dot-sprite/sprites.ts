import { COLORS } from '@/shared/constants';

/** 격자 글자와 색. 표에 없는 글자(`.`)는 그리지 않는다 */
export const SPRITE_COLORS: Record<string, string | undefined> = {
  y: COLORS.fire.core,
  o: COLORS.fire.mid,
  r: COLORS.fire.base,
  W: COLORS.fire.log,
  D: COLORS.fire.logShade,
  h: COLORS.focus.handleArm,
  H: COLORS.focus.handleCore,
  k: COLORS.rest.handleArm,
  K: COLORS.rest.handleCore,
  m: COLORS.focus.marker,
};

export const LOG_COLD = ['.W.', 'DWD', 'DWD', '.D.'];

export const BONFIRE_COLD_9 = ['.......', '.......', '.......', '.......', '.......', '.......', '..DDD..', '.DWWWD.', 'DWWWWWD'];

export const BONFIRE_COLD_7 = ['.......', '.......', '.......', '.......', '..DDD..', '.DWWWD.', 'DWWWWWD'];

/** 스파크 손잡이. 정지 상태는 이 프레임에 고정한다 */
export const SPARK_A = ['...h...', '...h...', '..hHh..', 'hHHHHHh', '..hHh..', '...h...', '...h...'];

/** 휴식 타이머 설정 손잡이. `DESIGN.md` §4 */
export const SPARK_REST = ['...k...', '...k...', '..kKk..', 'kKKKKKk', '..kKk..', '...k...', '...k...'];

/** 12시에 놓이는 기준 마커 */
export const MARKER = ['.m.', 'mmm', '.m.', '.m.', '.m.'];
