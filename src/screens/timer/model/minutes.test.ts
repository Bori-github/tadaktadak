import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useStoredMinutes } from './minutes';

// 저장값 읽기가 끝나는 시점을 테스트가 쥐고 있어야 「읽는 도중」을 만들 수 있음
let mockGate: Promise<void> = new Promise(() => {});
let mockRelease: () => void = () => {};
const mockStored: Record<string, string> = {};
const mockWritten: [string, string][] = [];

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: async (key: string) => {
      await mockGate;
      return mockStored[key] ?? null;
    },
    setItem: async (key: string, value: string) => {
      mockWritten.push([key, value]);
    },
    removeItem: async () => {},
  },
}));

/** 저장값을 아직 읽지 못한 상태의 화면 */
const renderBeforeRead = () => renderHook(() => useStoredMinutes());

beforeEach(() => {
  mockWritten.length = 0;
  mockStored['timer.minutes.focus'] = '40';
  mockStored['timer.minutes.rest'] = '10';
  mockGate = new Promise((resolve) => {
    mockRelease = resolve;
  });
});

describe('기기에 남는 타이머 시간(분)', () => {
  it('읽기가 끝나기 전에 바꾸면 그 값이 남는다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => result.current.changeMinutes('focus', 7));
    await act(async () => mockRelease());

    expect(result.current.minutes.focus).toBe(7);
  });

  it('조작이 없으면 저장값으로 시작한다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => mockRelease());

    expect(result.current.minutes).toEqual({ focus: 40, rest: 10 });
  });

  it('바꾼 타이머 시간을 기기에 남긴다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => result.current.storeMinutes('rest', 7));

    expect(mockWritten).toContainEqual(['timer.minutes.rest', '7']);
  });
});
