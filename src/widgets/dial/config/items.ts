import { type ThemeId } from '@/entities/theme';
import { type BonfireHeightInDots } from '@/shared/constants';
import { bulbOffset, type BulbOffset } from '@/shared/lib';
import {
  BONFIRE_COLD_7,
  BONFIRE_COLD_9,
  BONFIRE_HOT_A_7,
  BONFIRE_HOT_A_9,
  BONFIRE_HOT_B_7,
  BONFIRE_HOT_B_9,
  BULB_BIG_BLINK,
  BULB_BIG_OFF,
  BULB_BIG_ON,
  BULB_BLINK,
  BULB_OFF,
  BULB_ON,
  CAMPFIRE_SPRITE_COLORS,
  LOG_COLD,
  LOG_HOT_A,
  LOG_HOT_B,
  WINTER_SPRITE_COLORS,
} from '@/shared/ui/dot-sprite';

/** 눈금 스프라이트 */
export interface TickSprites {
  /** 점화 전 */
  base: readonly string[];
  /** 점화 후 순환 프레임. 눈금마다 위상 1 차이 */
  frames: readonly (readonly string[])[];
}

export interface DialItemStyle {
  minor: TickSprites;
  major: Record<BonfireHeightInDots, TickSprites>;
  colors: Record<string, string>;
  /** `frames` 전환 주기 (밀리초). 미지정 시 `FLICKER_MS` */
  frameMs?: number;
  /** 눈금 빛 번짐 색. 미지정 시 팔레트 `glow` */
  bloomColor?: string;
  isOutOfSettingVisible: boolean;
  offsetOf?: (tick: number) => BulbOffset;
}

const BULB_MAJOR: TickSprites = { base: BULB_BIG_OFF, frames: [BULB_BIG_ON, BULB_BIG_ON, BULB_BIG_ON, BULB_BIG_BLINK] };

/** 테마별 시계판 개체 스프라이트 설정 */
export const DIAL_ITEM_STYLES: Record<ThemeId, DialItemStyle> = {
  campfire: {
    minor: { base: LOG_COLD, frames: [LOG_HOT_A, LOG_HOT_B] },
    major: {
      7: { base: BONFIRE_COLD_7, frames: [BONFIRE_HOT_A_7, BONFIRE_HOT_B_7] },
      9: { base: BONFIRE_COLD_9, frames: [BONFIRE_HOT_A_9, BONFIRE_HOT_B_9] },
    },
    colors: CAMPFIRE_SPRITE_COLORS,
    isOutOfSettingVisible: true,
  },
  winter: {
    minor: { base: BULB_OFF, frames: [BULB_ON, BULB_ON, BULB_ON, BULB_BLINK] },
    major: { 7: BULB_MAJOR, 9: BULB_MAJOR },
    colors: WINTER_SPRITE_COLORS,
    frameMs: 500,
    bloomColor: '#ffc266',
    isOutOfSettingVisible: false,
    offsetOf: (tick) => bulbOffset(tick),
  },
};
