import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useRef as mockUseRef } from 'react';

import { useTimerSession } from './session';

import { TIMER_DEFAULT } from '@/entities/timer';

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

// Jest에는 UI 스레드가 없음
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: unknown) => mockUseRef({ value: initial }).current,
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

const STORED_PAUSED = JSON.stringify({ phase: 'paused', mode: 'rest', pausedRemainingMs: 90_000 });

/** 저장값을 아직 읽지 못한 상태의 화면 */
const renderBeforeRead = () => renderHook(() => useTimerSession({ settingMinutes: TIMER_DEFAULT }));

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

describe('남은 분 공유 값', () => {
  it('일시정지 저장값을 복구하면 남은 90초가 1.5분으로 담긴다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => mockRelease(STORED_PAUSED));

    expect(result.current.remainingMinutes.value).toBeCloseTo(1.5, 10);
  });
});
