import { useSyncExternalStore } from 'react';

import { EMPTY_SELECTION, loadThemeSelection, saveThemeSelection } from '../api/storage';
import { THEMES, type ThemeId } from '../config/themes';

import { resolveTheme } from './resolveTheme';

import { createStoredSetting } from '@/shared/lib';

const selectionSetting = createStoredSetting({
  initialValue: EMPTY_SELECTION,
  load: loadThemeSelection,
  save: saveThemeSelection,
});

/** 앱 사용 중 기간 시작/종료 시 테마 유지를 위해 `restoreTheme` 호출 시점 날짜로 고정 */
let startDate = new Date();

const getDisplayedTheme = (): ThemeId => {
  const { selectedThemeId, pastSelectedThemeIds } = selectionSetting.get();

  return resolveTheme({ themes: THEMES, date: startDate, selectedThemeId, pastSelectedThemeIds });
};

/**
 * 테마 선택 기록 복원과 표시 테마 기준 날짜 갱신. 앱 시작 시 1회 호출
 *
 * @returns 복원 완료 시 이행하는 Promise
 */
export const restoreTheme = (): Promise<void> => {
  startDate = new Date();

  return selectionSetting.restore();
};

/**
 * 선택 테마 즉시 표시와 선택 기록 저장
 *
 * @returns 없음
 */
export const selectTheme = (id: ThemeId): void => {
  const { pastSelectedThemeIds } = selectionSetting.get();
  // 자동 적용 중이던 테마도 이력에 추가해 다음 기간 자동 적용 제외
  const nextPastSelectedThemeIds = [...new Set([...pastSelectedThemeIds, id, getDisplayedTheme()])];

  selectionSetting.set({ selectedThemeId: id, pastSelectedThemeIds: nextPastSelectedThemeIds });
};

/**
 * 테마 선택, 복원 완료 시 리렌더링
 *
 * @returns 표시 중인 테마
 */
export const useDisplayedTheme = (): ThemeId => useSyncExternalStore(selectionSetting.subscribe, getDisplayedTheme);
