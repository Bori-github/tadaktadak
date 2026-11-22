import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { restoreTheme, selectTheme, useDisplayedTheme } from './store';

const DECEMBER = new Date(2026, 11, 15);
const NEXT_MARCH = new Date(2027, 2, 15);
const NEXT_JUNE = new Date(2027, 5, 15);
const NEXT_DECEMBER = new Date(2027, 11, 15);

/** 기기 날짜를 `date`로 설정 후 앱 재시작 */
const startApp = async (date: Date): Promise<void> => {
  jest.setSystemTime(date);
  await act(async () => {
    await restoreTheme();
  });
};

describe('표시 중인 테마', () => {
  // AsyncStorage와 모듈 상태 초기화로 앱 최초 실행 상태 재현
  beforeEach(async () => {
    jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'] });
    await AsyncStorage.clear();
    await startApp(NEXT_JUNE);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('기간 안에 처음 시작하면 그 기간의 테마를 표시한다', async () => {
    const { result } = await renderHook(() => useDisplayedTheme());

    await startApp(DECEMBER);

    expect(result.current).toBe('winter');
  });

  it('테마를 선택하면 바로 표시한다', async () => {
    const { result } = await renderHook(() => useDisplayedTheme());

    await act(async () => {
      selectTheme('winter');
    });

    expect(result.current).toBe('winter');
  });

  it('자동 적용 중에 다른 테마를 선택하면 다음 해 기간에도 자동 적용하지 않는다', async () => {
    const { result } = await renderHook(() => useDisplayedTheme());

    await startApp(DECEMBER);
    await act(async () => {
      selectTheme('campfire');
    });
    await startApp(NEXT_DECEMBER);

    expect(result.current).toBe('campfire');
  });

  it('자동 적용 중인 테마를 선택하면 기간이 끝난 뒤에도 표시한다', async () => {
    const { result } = await renderHook(() => useDisplayedTheme());

    await startApp(DECEMBER);
    await act(async () => {
      selectTheme('winter');
    });
    await startApp(NEXT_JUNE);

    expect(result.current).toBe('winter');
  });

  it('자동 적용된 테마를 선택하지 않고 기간이 끝나면 모닥불 테마를 표시하고 다음 해 기간에 다시 자동 적용한다', async () => {
    const { result } = await renderHook(() => useDisplayedTheme());

    await startApp(DECEMBER);
    await startApp(NEXT_MARCH);
    expect(result.current).toBe('campfire');

    await startApp(NEXT_DECEMBER);
    expect(result.current).toBe('winter');
  });

  it.each([
    { label: 'JSON이 아님', raw: '{selectedThemeId' },
    { label: '목록에 없는 테마', raw: '{"selectedThemeId":"summer","pastSelectedThemeIds":["summer"]}' },
    { label: '선택 이력이 배열이 아님', raw: '{"selectedThemeId":"winter","pastSelectedThemeIds":"winter"}' },
  ])('저장값을 읽을 수 없으면 선택 기록이 없는 것으로 본다: $label', async ({ raw }) => {
    await AsyncStorage.setItem('theme', raw);
    const { result } = await renderHook(() => useDisplayedTheme());

    await startApp(DECEMBER);

    expect(result.current).toBe('winter');
  });
});
