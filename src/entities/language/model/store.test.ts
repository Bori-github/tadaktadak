import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { loadLanguage, saveLanguage } from '../api/storage';

import { restoreLanguage, selectLanguage, useLanguage } from './store';

const mockDeviceLocales = [{ languageCode: 'ko' }];

jest.mock('expo-localization', () => ({
  useLocales: () => mockDeviceLocales,
}));

let storageSpy: ReturnType<typeof jest.spyOn> | null = null;

describe('선택한 언어', () => {
  // 저장소와 모듈이 기억하는 선택을 함께 비워 앱을 처음 켠 상태에서 시작
  beforeEach(async () => {
    await AsyncStorage.clear();
    await restoreLanguage();
  });

  afterEach(() => {
    storageSpy?.mockRestore();
    storageSpy = null;
  });

  it('저장된 언어가 없으면 기기 언어인 한국어를 반환한다', async () => {
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      await restoreLanguage();
    });

    expect(result.current).toBe('ko-KR');
  });

  it('저장된 언어가 영어면 기기 언어가 한국어여도 영어를 반환한다', async () => {
    await saveLanguage('en-US');
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      await restoreLanguage();
    });

    expect(result.current).toBe('en-US');
  });

  it('언어를 선택하면 바로 반환하고 기기에 저장한다', async () => {
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      selectLanguage('en-US');
    });

    expect(result.current).toBe('en-US');
    expect(await loadLanguage()).toBe('en-US');
  });

  it('저장이 끝나기 전에도 선택한 언어를 반환한다', async () => {
    storageSpy = jest.spyOn(AsyncStorage, 'setItem').mockReturnValue(new Promise(() => {}));
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      selectLanguage('en-US');
    });

    expect(result.current).toBe('en-US');
  });

  it('저장에 실패해도 선택한 언어를 반환한다', async () => {
    storageSpy = jest.spyOn(AsyncStorage, 'setItem').mockImplementation(async () => {
      throw new Error('기기 저장소 오류');
    });
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      selectLanguage('en-US');
    });

    expect(result.current).toBe('en-US');
  });

  it('저장값을 읽지 못하면 기기 언어인 한국어를 반환한다', async () => {
    storageSpy = jest.spyOn(AsyncStorage, 'getItem').mockImplementation(async () => {
      throw new Error('기기 저장소 오류');
    });
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      await restoreLanguage();
    });

    expect(result.current).toBe('ko-KR');
  });

  it('저장값을 읽는 동안 선택하면 선택한 언어를 유지한다', async () => {
    await saveLanguage('ko-KR');
    const { result } = await renderHook(() => useLanguage());

    await act(async () => {
      const restoring = restoreLanguage();
      selectLanguage('en-US');
      await restoring;
    });

    expect(result.current).toBe('en-US');
  });
});
