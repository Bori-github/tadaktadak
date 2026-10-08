import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook } from '@testing-library/react-native';

import { loadAmbientSoundEnabled, saveAmbientSoundEnabled } from '../api/storage';

import { restoreAmbientSoundEnabled, setAmbientSoundEnabled, useAmbientSoundEnabled } from './store';

describe('배경음 사용 여부', () => {
  // AsyncStorage와 모듈 상태를 초기화해 첫 실행 상태로 시작
  beforeEach(async () => {
    await AsyncStorage.clear();
    await restoreAmbientSoundEnabled();
  });

  it('저장값이 없으면 꺼짐이다', async () => {
    const { result } = await renderHook(() => useAmbientSoundEnabled());

    expect(result.current).toBe(false);
  });

  it('저장된 켜짐을 복원한다', async () => {
    await saveAmbientSoundEnabled(true);
    const { result } = await renderHook(() => useAmbientSoundEnabled());

    await act(async () => {
      await restoreAmbientSoundEnabled();
    });

    expect(result.current).toBe(true);
  });

  it('저장값 읽기에 실패하면 꺼짐을 유지한다', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('기기 저장소 오류'));
    const { result } = await renderHook(() => useAmbientSoundEnabled());

    await act(async () => {
      await restoreAmbientSoundEnabled();
    });

    expect(result.current).toBe(false);
  });

  it('복원 중에 켠 값을 저장값으로 덮어쓰지 않는다', async () => {
    const { result } = await renderHook(() => useAmbientSoundEnabled());

    await act(async () => {
      const restoring = restoreAmbientSoundEnabled();
      setAmbientSoundEnabled(true);
      await restoring;
    });

    expect(result.current).toBe(true);
  });

  it('켜면 즉시 반영하고 AsyncStorage에 저장한다', async () => {
    const { result } = await renderHook(() => useAmbientSoundEnabled());

    await act(async () => {
      setAmbientSoundEnabled(true);
    });

    expect(result.current).toBe(true);
    expect(await loadAmbientSoundEnabled()).toBe(true);
  });

  it('저장에 실패해도 켠 값을 반영한다', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('기기 저장소 오류'));
    const { result } = await renderHook(() => useAmbientSoundEnabled());

    await act(async () => {
      setAmbientSoundEnabled(true);
    });

    expect(result.current).toBe(true);
  });
});
