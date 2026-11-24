import { type ThemeId } from '@/entities/theme';
import { type MajorItemHeightInDots } from '@/shared/constants';
import { bulbCenter, type DialPlacement } from '@/shared/lib';
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

export interface TickSprites {
  /** 점화 전 */
  base: readonly string[];
  /** 점화 후 순환 프레임. 눈금마다 위상 1 차이 */
  frames: readonly (readonly string[])[];
}

export interface DialItemStyle {
  minor: TickSprites;
  major: Record<MajorItemHeightInDots, TickSprites>;
  colors: Record<string, string>;
  /** `frames` 전환 주기 (밀리초). 미지정 시 `FLICKER_MS` */
  frameMs?: number;
  /** 눈금 빛 번짐 색. 미지정 시 팔레트 `glow` */
  bloomColor?: string;
  haloColor?: string;
  /** 빛 번짐/후광 중심의 y 오프셋 (dot) */
  glowOffsetInDots?: number;
  isOutOfSettingVisible: boolean;
  /** 완료 연출 중 점화 개체 밝기 */
  completedBrightness: number;
  /** 미지정 시 눈금 중심 */
  centerOf?: (tick: number, dial: DialPlacement) => { x: number; y: number };
}

const BULB_MAJOR: TickSprites = { base: BULB_BIG_OFF, frames: [BULB_BIG_ON, BULB_BIG_ON, BULB_BIG_ON, BULB_BIG_BLINK] };

export const DIAL_ITEM_STYLES: Record<ThemeId, DialItemStyle> = {
  campfire: {
    minor: { base: LOG_COLD, frames: [LOG_HOT_A, LOG_HOT_B] },
    major: {
      7: { base: BONFIRE_COLD_7, frames: [BONFIRE_HOT_A_7, BONFIRE_HOT_B_7] },
      9: { base: BONFIRE_COLD_9, frames: [BONFIRE_HOT_A_9, BONFIRE_HOT_B_9] },
    },
    colors: CAMPFIRE_SPRITE_COLORS,
    isOutOfSettingVisible: true,
    completedBrightness: 1,
  },
  winter: {
    minor: { base: BULB_OFF, frames: [BULB_ON, BULB_ON, BULB_ON, BULB_BLINK] },
    major: { 7: BULB_MAJOR, 9: BULB_MAJOR },
    colors: WINTER_SPRITE_COLORS,
    frameMs: 500,
    bloomColor: '#ffc266',
    haloColor: '#fff0c0',
    // 전구 유리 중심
    glowOffsetInDots: 1,
    isOutOfSettingVisible: false,
    // 순환 빛과 대비되는 밝기
    completedBrightness: 0.2,
    centerOf: (tick, dial) => bulbCenter(tick, dial),
  },
};
