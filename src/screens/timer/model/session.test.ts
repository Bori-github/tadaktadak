import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useTimerSession } from './session';

import { type TimerMode } from '@/entities/timer';

// 저장값 읽기가 끝나는 시점을 테스트가 쥐고 있어야 「읽는 도중」을 만들 수 있음
let mockRead: Promise<string | null> = new Promise(() => {});
let mockRelease: (raw: string | null) => void = () => {};
const mockWritten: string[] = [];

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: () => mockRead,
    setItem: async (_key: string, value: string) => {
      mockWritten.push(value);
    },
    removeItem: async () => {},
  },
}));

// Jest에는 UI 스레드가 없어 공유 값은 바뀌는 칸으로, 예약은 바로 부르는 것으로 대신함
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: unknown) => ({ value: initial }),
  useFrameCallback: () => ({ setActive: () => {} }),
}));
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args),
  scheduleOnUI: (callback: () => void) => callback(),
}));
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: async () => {},
  deactivateKeepAwake: async () => {},
}));

const SETTING_MINUTES: Record<TimerMode, number> = { focus: 25, rest: 5 };
const STORED_PAUSED = JSON.stringify({ phase: 'paused', mode: 'rest', pausedRemainingMs: 90_000 });

/** 저장값을 아직 읽지 못한 상태의 화면 */
const renderBeforeRead = () => renderHook(() => useTimerSession({ settingMinutes: SETTING_MINUTES }));

beforeEach(() => {
  mockWritten.length = 0;
  mockRead = new Promise((resolve) => {
    mockRelease = resolve;
  });
});

describe('저장값을 읽는 사이의 조작', () => {
  it('읽기가 끝나기 전에 재생하면 그 조작이 남는다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => result.current.play());
    await act(async () => mockRelease(STORED_PAUSED));

    expect(result.current.session.phase).toBe('running');
  });

  it('읽기가 끝나기 전에 재생하면 그 단계를 기기에 남긴다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => result.current.play());
    await act(async () => mockRelease(null));

    expect(mockWritten.map((value) => JSON.parse(value).phase)).toContain('running');
  });

  it('조작이 없으면 저장값으로 되돌아간다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => mockRelease(STORED_PAUSED));

    expect(result.current.session).toEqual({ phase: 'paused', mode: 'rest', pausedRemainingMs: 90_000 });
  });
});
