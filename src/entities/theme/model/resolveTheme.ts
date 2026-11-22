import { DEFAULT_THEME_ID, THEME_IDS, type Period, type ThemeDefinition, type ThemeId } from '../config/themes';

/**
 * @returns `date`의 월일이 `period` 시작일부터 종료일 사이면 true
 */
const isInPeriod = ({ start, end }: Period, date: Date): boolean => {
  const toKey = (month: number, day: number): number => month * 100 + day;
  const today = toKey(date.getMonth() + 1, date.getDate());
  const startKey = toKey(start.month, start.day);
  const endKey = toKey(end.month, end.day);

  if (startKey <= endKey) return startKey <= today && today <= endKey;

  // 연도를 넘는 기간
  return startKey <= today || today <= endKey;
};

interface ResolveThemeParams {
  themes: Record<ThemeId, ThemeDefinition>;
  date: Date;
  selectedThemeId: ThemeId | null;
  pastSelectedThemeIds: readonly ThemeId[];
}

/**
 * 앱 시작 시 표시할 테마
 *
 * @param params.themes - 테마 정의
 * @param params.date - 기기 날짜
 * @param params.selectedThemeId - 사용자가 직접 선택한 테마. 미선택 시 `null`
 * @param params.pastSelectedThemeIds - 선택 이력
 * @returns 기간 안 미선택 테마 중 최고 우선순위 테마. 없으면 `selectedThemeId`, `null`이면 `DEFAULT_THEME_ID`
 */
export const resolveTheme = ({ themes, date, selectedThemeId, pastSelectedThemeIds }: ResolveThemeParams): ThemeId => {
  const autoApplied = THEME_IDS.filter((id) => !pastSelectedThemeIds.includes(id))
    .flatMap((id) => {
      const { period } = themes[id];
      return period !== undefined && isInPeriod(period, date) ? [{ id, priority: period.priority }] : [];
    })
    .sort((a, b) => b.priority - a.priority)[0];

  return autoApplied?.id ?? selectedThemeId ?? DEFAULT_THEME_ID;
};
