import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useRef as mockUseRef } from 'react';

import { useTimerSession } from './session';

import { MINUTE_IN_MS, READY_SESSION, TIMER_DEFAULT, type TimerMode } from '@/entities/timer';

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

/** 완료를 만드는 저장값. 끝날 시각이 지난 진행은 읽을 때 완료가 됨 */
const storedCompleted = (mode: TimerMode) => JSON.stringify({ phase: 'running', mode, endsAt: Date.now() - 1000 });

const renderCompleted = async (mode: TimerMode, settingMinutes: Record<TimerMode, number> = TIMER_DEFAULT) => {
  const { result } = await renderHook(() => useTimerSession({ settingMinutes }));

  await act(async () => mockRelease(storedCompleted(mode)));

  return result;
};

beforeEach(() => {
  // 지금 시각이 멈춰야 끝날 시각을 한 값으로 비교할 수 있음
  jest.useFakeTimers();

  mockWritten.length = 0;
  mockRead = new Promise((resolve) => {
    mockRelease = resolve;
  });
});

afterEach(() => {
  jest.useRealTimers();
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

describe('완료 뒤 자동 시작', () => {
  it('집중 타이머가 끝나면 그 자리에서 휴식 진행이 된다', async () => {
    const result = await renderCompleted('focus');

    expect(result.current.session).toEqual({ phase: 'running', mode: 'rest', endsAt: Date.now() + TIMER_DEFAULT.rest * MINUTE_IN_MS });
  });

  it('휴식 타이머가 0분이면 완료 그대로다', async () => {
    const result = await renderCompleted('focus', { focus: 25, rest: 0 });

    expect(result.current.session).toEqual({ phase: 'completed', mode: 'focus' });
  });

  it('휴식 타이머가 끝나면 완료 그대로다', async () => {
    const result = await renderCompleted('rest');

    expect(result.current.session).toEqual({ phase: 'completed', mode: 'rest' });
  });
});

describe('카운트다운 중인 타이머', () => {
  it('휴식이 시작되면 휴식으로 바뀐다', async () => {
    const result = await renderCompleted('focus');

    expect(result.current.countingMode.value).toBe('rest');
  });

  it('휴식 일시정지를 복구하면 휴식으로 바뀐다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => mockRelease(STORED_PAUSED));

    expect(result.current.countingMode.value).toBe('rest');
  });
});

describe('완료에서 재생', () => {
  it('휴식 타이머가 0분이면 재생했을 때 집중 타이머 대기가 된다', async () => {
    const result = await renderCompleted('focus', { focus: 25, rest: 0 });

    await act(async () => result.current.play());

    expect(result.current.session).toEqual(READY_SESSION);
  });

  it('휴식 타이머가 끝난 자리에서 재생하면 집중 타이머 대기가 된다', async () => {
    const result = await renderCompleted('rest');

    await act(async () => result.current.play());

    expect(result.current.session).toEqual(READY_SESSION);
  });
});

describe('남은 분 공유 값', () => {
  it('일시정지 저장값을 복구하면 남은 90초가 1.5분으로 담긴다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => mockRelease(STORED_PAUSED));

    expect(result.current.remainingMinutes.value).toBeCloseTo(1.5, 10);
  });
});
