import { COLOR_TOKENS } from '@/shared/constants';
import { type Palette } from '@/shared/lib';

const CAMPFIRE = COLOR_TOKENS.campfire;
const WINTER = COLOR_TOKENS.winter;

/** 모닥불 스프라이트 글자별 색 */
export const CAMPFIRE_SPRITE_COLORS: Record<string, string> = {
  f: CAMPFIRE['fire/ignite-bright'],
  F: CAMPFIRE['fire/ignite-mid'],
  y: CAMPFIRE['fire/core'],
  o: CAMPFIRE['fire/mid'],
  r: CAMPFIRE['fire/base'],
  W: CAMPFIRE['fire/log'],
  D: CAMPFIRE['fire/log-shade'],
};

/** 전구 스프라이트 글자별 색. 소문자 꺼짐, 대문자 켜짐 */
export const WINTER_SPRITE_COLORS: Record<string, string> = {
  g: WINTER['bulb/cap-light'],
  G: WINTER['bulb/cap-dark'],
  a: WINTER['bulb/off-highlight'],
  b: WINTER['bulb/off-core'],
  d: WINTER['bulb/off-mid'],
  e: WINTER['bulb/off-edge'],
  A: WINTER['bulb/on-highlight'],
  B: WINTER['bulb/on-core'],
  D: WINTER['bulb/on-mid'],
  E: WINTER['bulb/on-edge'],
};

/**
 * 공통 팔레트 기반 스프라이트 글자별 색(손잡이, 기준 표식). 미정의 글자(`.`)는 렌더링 제외
 *
 * @returns 글자별 색
 */
export const getSpriteColors = ({ focus, rest }: Palette): Record<string, string | undefined> => ({
  h: focus.thumbArm,
  H: focus.thumbCore,
  k: rest.thumbArm,
  K: rest.thumbCore,
  m: focus.marker,
});

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

export const BULB_OFF = ['.g.', 'GgG', 'abd', 'bde', '.e.'];

export const BULB_ON = ['.g.', 'GgG', 'ABD', 'BDE', '.E.'];

/** 켜진 전구의 반사광 소등 프레임 */
export const BULB_BLINK = ['.g.', 'GgG', 'BBD', 'BDE', '.E.'];

export const BULB_BIG_OFF = ['.ggg.', '.GgG.', '.abd.', 'abbde', 'bbbde', '.bde.', '..e..'];

export const BULB_BIG_ON = ['.ggg.', '.GgG.', '.ABD.', 'ABBDE', 'BBBDE', '.BDE.', '..E..'];

export const BULB_BIG_BLINK = ['.ggg.', '.GgG.', '.BBD.', 'BBBDE', 'BBBDE', '.BDE.', '..E..'];

/** 손잡이. A와 B를 번갈아 그림. 반짝이지 않는 동안은 A. `DESIGN.md` §4 */
export const SPARK_A = ['...h...', '...h...', '..hHh..', 'hHHHHHh', '..hHh..', '...h...', '...h...'];

export const SPARK_B = ['.......', '...h...', '..hHh..', '.hHHHh.', '..hHh..', '...h...', '.......'];

/** 휴식 타이머 설정 손잡이. `DESIGN.md` §4 */
export const SPARK_REST = ['...k...', '...k...', '..kKk..', 'kKKKKKk', '..kKk..', '...k...', '...k...'];

/** 12시에 놓이는 기준 마커 */
export const MARKER = ['.m.', 'mmm', '.m.', '.m.', '.m.'];
