import { DEFAULT_PALETTE } from '@/shared/constants';
import { type Palette } from '@/shared/lib';

/** 테마 선택 화면 표시 순서 */
export const THEME_IDS = ['campfire', 'winter'] as const;

export type ThemeId = (typeof THEME_IDS)[number];

interface MonthDay {
  month: number;
  day: number;
}

export interface Period {
  start: MonthDay;
  /** 시작보다 앞선 월일이면 다음 해의 월일 */
  end: MonthDay;
  /** 기간이 겹치면 값이 큰 테마 표시 */
  priority: number;
}

export interface ThemeDefinition {
  palette: Palette;
  /** 선택한 적 없으면 자동 적용하는 기간. 없으면 자동 적용하지 않음 */
  period?: Period;
}

export const DEFAULT_THEME_ID: ThemeId = 'campfire';

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  campfire: {
    palette: DEFAULT_PALETTE,
  },
  winter: {
    palette: DEFAULT_PALETTE,
    // 2월 29일까지로 두어 윤년 포함
    period: { start: { month: 12, day: 1 }, end: { month: 2, day: 29 }, priority: 1 },
  },
};
