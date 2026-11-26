import { COLOR_TOKENS } from '@/shared/constants';
import { DEFAULT_PALETTE, createPalette, type Palette } from '@/shared/lib';

/** 테마 선택 화면 표시 순서 */
export const THEME_IDS = ['campfire', 'winter'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

interface MonthDay {
  month: number;
  day: number;
}

export interface Period {
  start: MonthDay;
  /** `start`보다 이른 월일이면 다음 해 날짜 */
  end: MonthDay;
  /** 기간이 겹치면 값이 큰 테마 표시 */
  priority: number;
}

export interface ThemeDefinition {
  palette: Palette;
  /** 자동 적용 기간. 미지정 시 자동 적용 제외 */
  period?: Period;
}

export const DEFAULT_THEME_ID: ThemeId = 'campfire';

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  campfire: {
    palette: DEFAULT_PALETTE,
  },
  winter: {
    palette: createPalette(COLOR_TOKENS.winter),
    // 종료일 2월 29일로 윤년 포함
    period: { start: { month: 12, day: 1 }, end: { month: 2, day: 29 }, priority: 1 },
  },
};
