import AsyncStorage from '@react-native-async-storage/async-storage';

import { THEME_IDS, type ThemeId } from '../config/themes';

const THEME_KEY = 'theme';

export interface ThemeSelection {
  /** 사용자가 직접 선택한 테마. 미선택 시 `null` */
  selectedThemeId: ThemeId | null;
  /** 선택 이력. 선택 시점에 자동 적용 중이던 테마 포함 */
  pastSelectedThemeIds: ThemeId[];
}

export const EMPTY_SELECTION: ThemeSelection = { selectedThemeId: null, pastSelectedThemeIds: [] };

const isThemeId = (value: unknown): value is ThemeId => THEME_IDS.some((id) => id === value);

/**
 * 저장 문자열을 테마 선택 기록으로 파싱
 *
 * @param raw - AsyncStorage 조회 결과. 저장값 없음 시 `null`
 * @returns 테마 선택 기록. 파싱 실패 시 `EMPTY_SELECTION`
 */
const parseSelection = (raw: string | null): ThemeSelection => {
  if (raw === null) return EMPTY_SELECTION;

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return EMPTY_SELECTION;
  }

  if (typeof value !== 'object' || value === null) return EMPTY_SELECTION;

  const { selectedThemeId, pastSelectedThemeIds } = value as Record<string, unknown>;
  if (selectedThemeId !== null && !isThemeId(selectedThemeId)) return EMPTY_SELECTION;
  if (!Array.isArray(pastSelectedThemeIds) || !pastSelectedThemeIds.every(isThemeId)) return EMPTY_SELECTION;

  return { selectedThemeId, pastSelectedThemeIds };
};

/**
 * AsyncStorage의 테마 선택 기록 조회
 *
 * @returns 테마 선택 기록. 저장값 없음 또는 파싱 실패 시 `EMPTY_SELECTION`
 */
export const loadThemeSelection = async (): Promise<ThemeSelection> => parseSelection(await AsyncStorage.getItem(THEME_KEY));

/**
 * 테마 선택 기록을 AsyncStorage에 저장
 *
 * @returns 저장 완료 시 이행하는 Promise
 */
export const saveThemeSelection = async (selection: ThemeSelection): Promise<void> => AsyncStorage.setItem(THEME_KEY, JSON.stringify(selection));
