import { COLORS } from '@/shared/constants';

/** 격자 글자와 색. 표에 없는 글자(`.`)는 그리지 않는다 */
export const SPRITE_COLORS: Record<string, string | undefined> = {
  f: COLORS.fire.igniteBright,
  F: COLORS.fire.igniteMid,
  y: COLORS.fire.core,
  o: COLORS.fire.mid,
  r: COLORS.fire.base,
  W: COLORS.fire.log,
  D: COLORS.fire.logShade,
  h: COLORS.focus.thumbArm,
  H: COLORS.focus.thumbCore,
  k: COLORS.rest.thumbArm,
  K: COLORS.rest.thumbCore,
  m: COLORS.focus.marker,
};

export const LOG_COLD = ['.W.', 'DWD', 'DWD', '.D.'];

/** 불붙은 장작. A와 B를 번갈아 그림 */
export const LOG_HOT_A = ['.f.', 'FWF', 'DWD', '.D.'];

export const LOG_HOT_B = ['.F.', 'fWf', 'DWD', '.D.'];

export const BONFIRE_COLD_9 = ['.......', '.......', '.......', '.......', '.......', '.......', '..DDD..', '.DWWWD.', 'DWWWWWD'];

export const BONFIRE_COLD_7 = ['.......', '.......', '.......', '.......', '..DDD..', '.DWWWD.', 'DWWWWWD'];

/** 타는 모닥불. A와 B를 번갈아 그림 */
export const BONFIRE_HOT_A_9 = ['...y...', '..yoy..', '.yoooy.', '.roooor', '.rroorr', '..rrr..', '..DDD..', '.DWWWD.', 'DWWWWWD'];

export const BONFIRE_HOT_B_9 = ['..y....', '.yoyo..', '.yoooy.', 'rooooor', '.rroorr', '..rrr..', '..DDD..', '.DWWWD.', 'DWWWWWD'];

export const BONFIRE_HOT_A_7 = ['.yoooy.', '.roooor', '.rroorr', '..rrr..', '..DDD..', '.DWWWD.', 'DWWWWWD'];

export const BONFIRE_HOT_B_7 = ['.yoooy.', 'rooooor', '.rroorr', '..rrr..', '..DDD..', '.DWWWD.', 'DWWWWWD'];

/** 손잡이. A와 B를 번갈아 그림. 반짝이지 않는 동안은 A. `DESIGN.md` §4 */
export const SPARK_A = ['...h...', '...h...', '..hHh..', 'hHHHHHh', '..hHh..', '...h...', '...h...'];

export const SPARK_B = ['.......', '...h...', '..hHh..', '.hHHHh.', '..hHh..', '...h...', '.......'];

/** 휴식 타이머 설정 손잡이. `DESIGN.md` §4 */
export const SPARK_REST = ['...k...', '...k...', '..kKk..', 'kKKKKKk', '..kKk..', '...k...', '...k...'];

/** 12시에 놓이는 기준 마커 */
export const MARKER = ['.m.', 'mmm', '.m.', '.m.', '.m.'];
