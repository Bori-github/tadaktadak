import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useDismissibleNotice } from './notice';

const STORAGE_KEY = 'exampleDismissed';

const mockStored: Record<string, string> = {};
const mockFailure = { get: false, set: false };

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => {
      if (mockFailure.get) throw new Error('읽기 실패');
      return mockStored[key] ?? null;
    },
    setItem: async (key: string, value: string) => {
      if (mockFailure.set) throw new Error('저장 실패');
      mockStored[key] = value;
    },
  },
}));

beforeEach(() => {
  delete mockStored[STORAGE_KEY];
  mockFailure.get = false;
  mockFailure.set = false;
});

describe('`storageKey`에 닫기 기록이 없을 때만 표시하는 안내의 표시 여부', () => {
  it('닫기 기록이 없으면 안내를 표시한다', async () => {
    const { result } = await renderHook(() => useDismissibleNotice(STORAGE_KEY));

    await waitFor(() => expect(result.current.isVisible).toBe(true));
  });

  it('dismiss 호출 시 안내를 숨기고 다시 mount해도 표시하지 않는다', async () => {
    const first = await renderHook(() => useDismissibleNotice(STORAGE_KEY));
    await waitFor(() => expect(first.result.current.isVisible).toBe(true));

    await act(async () => {
      first.result.current.dismiss();
    });
    expect(first.result.current.isVisible).toBe(false);

    const next = await renderHook(() => useDismissibleNotice(STORAGE_KEY));
    await act(async () => {});
    expect(next.result.current.isVisible).toBe(false);
  });

  it('닫기 기록 읽기에 실패하면 안내를 표시하지 않는다', async () => {
    mockFailure.get = true;

    const { result } = await renderHook(() => useDismissibleNotice(STORAGE_KEY));
    await act(async () => {});

    expect(result.current.isVisible).toBe(false);
  });

  it('닫기 기록 저장에 실패하면 다시 mount 시 안내를 표시한다', async () => {
    const first = await renderHook(() => useDismissibleNotice(STORAGE_KEY));
    await waitFor(() => expect(first.result.current.isVisible).toBe(true));

    mockFailure.set = true;
    await act(async () => {
      first.result.current.dismiss();
    });
    expect(first.result.current.isVisible).toBe(false);

    const next = await renderHook(() => useDismissibleNotice(STORAGE_KEY));
    await waitFor(() => expect(next.result.current.isVisible).toBe(true));
  });
});
