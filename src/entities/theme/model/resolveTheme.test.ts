import { describe, expect, it } from '@jest/globals';

import { THEMES, type ThemeDefinition, type ThemeId } from '../config/themes';

import { resolveTheme } from './resolveTheme';

const IN_WINTER = new Date(2026, 11, 15);

describe('앱 시작 시 표시할 테마', () => {
  it('직접 선택한 테마가 있어도 기간 안에서 선택한 적 없는 테마를 표시한다', () => {
    expect(resolveTheme({ themes: THEMES, date: IN_WINTER, selectedThemeId: 'campfire', pastSelectedThemeIds: ['campfire'] })).toBe('winter');
  });

  it.each([
    { label: '12월 1일', date: new Date(2026, 11, 1), expected: 'winter' },
    { label: '윤년 2월 29일', date: new Date(2028, 1, 29), expected: 'winter' },
    { label: '3월 1일', date: new Date(2027, 2, 1), expected: 'campfire' },
    { label: '11월 30일', date: new Date(2026, 10, 30), expected: 'campfire' },
  ])('겨울 테마 기간 경계: $label', ({ date, expected }) => {
    expect(resolveTheme({ themes: THEMES, date, selectedThemeId: null, pastSelectedThemeIds: [] })).toBe(expected);
  });

  it('기간 안의 테마가 여러 개이면 우선순위가 높은 테마를 표시한다', () => {
    const period = { start: { month: 12, day: 1 }, end: { month: 2, day: 29 } };
    const themes: Record<ThemeId, ThemeDefinition> = {
      campfire: { ...THEMES.campfire, period: { ...period, priority: 1 } },
      winter: { ...THEMES.winter, period: { ...period, priority: 2 } },
    };

    expect(resolveTheme({ themes, date: IN_WINTER, selectedThemeId: null, pastSelectedThemeIds: [] })).toBe('winter');
  });
});
