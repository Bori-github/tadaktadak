import { COLORS } from '@/shared/constants';

/** 격자 글자와 색. 표에 없는 글자(`.`)는 그리지 않는다 */
export const SPRITE_COLORS: Record<string, string | undefined> = {
  y: COLORS.fire.core,
  o: COLORS.fire.mid,
  r: COLORS.fire.base,
  W: COLORS.fire.log,
  D: COLORS.fire.logShade,
};

export const LOG_COLD = ['.W.', 'DWD', 'DWD', '.D.'];

export const BONFIRE_COLD_9 = ['.......', '.......', '.......', '.......', '.......', '.......', '..DDD..', '.DWWWD.', 'DWWWWWD'];

export const BONFIRE_COLD_7 = ['.......', '.......', '.......', '.......', '..DDD..', '.DWWWD.', 'DWWWWWD'];
