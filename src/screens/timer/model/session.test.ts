import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';
import { useRef as mockUseRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { type HapticEvent } from '@modules/haptic-pattern';

import { useTimerSession } from './session';

import { COMPLETION_PATTERN, MINUTE_IN_MS, NOW, READY_SESSION, TIMER_DEFAULT, type TimerMode } from '@/entities/timer';

// 저장값 읽기가 끝나는 시점을 테스트가 쥐고 있어야 「읽는 도중」을 만들 수 있음
let mockRead: Promise<string | null> = new Promise(() => {});
let mockRelease: (raw: string | null) => void = () => {};
const mockWritten: string[] = [];
let mockRemovedCount = 0;
const mockPatterns: HapticEvent[][] = [];

// 프레임 콜백을 테스트가 직접 호출해야 포그라운드 완료가 됨
let mockOnFrame: ((frame: { timestamp: number }) => void) | null = null;

// 예약과 도착 사이에 정지하는 틈을 만들려면 예약을 붙들 수 있어야 함. `null`이면 곧바로 실행
let mockPending: (() => void)[] | null = null;

// 포그라운드 복귀를 테스트에서 직접 생성해야 함
const mockAppStateListeners: ((state: AppStateStatus) => void)[] = [];

// jest-expo가 `currentState`를 함수로 모의함. 실제 React Native는 문자열이라 문자열을 주도록 되돌림
let mockAppState = 'active';

Object.defineProperty(AppState, 'currentState', { configurable: true, get: () => mockAppState });

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: () => mockRead,
    setItem: async (_key: string, value: string) => {
      mockWritten.push(value);
    },
    removeItem: async () => {
      mockRemovedCount += 1;
    },
  },
}));

// Jest에는 UI 스레드가 없음
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: unknown) => mockUseRef({ value: initial }).current,
  useFrameCallback: (callback: (frame: { timestamp: number }) => void) => {
    mockOnFrame = callback;

    return { setActive: () => {} };
  },
}));
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    if (mockPending === null) callback(...args);
    else mockPending.push(() => callback(...args));
  },
  scheduleOnUI: (callback: () => void) => callback(),
}));
jest.mock('expo-keep-awake', () => ({
  activateKeepAwakeAsync: async () => {},
  deactivateKeepAwake: async () => {},
}));
jest.mock('@modules/haptic-pattern', () => ({
  hapticPattern: {
    playAsync: async (events: HapticEvent[]) => {
      mockPatterns.push(events);
    },
  },
}));

const requireFrameCallback = () => {
  if (mockOnFrame === null) throw new Error('프레임 콜백이 등록되지 않음');

  return mockOnFrame;
};

const STORED_PAUSED = JSON.stringify({ phase: 'paused', mode: 'rest', startedAt: NOW, pausedRemainingMs: 90_000 });

/** 저장값을 아직 읽지 못한 상태의 화면 */
const renderBeforeRead = () => renderHook(() => useTimerSession({ settingMinutes: TIMER_DEFAULT }));

/** 완료를 만드는 저장값. 끝날 시각이 지난 진행은 읽을 때 완료가 됨 */
const storedCompleted = (mode: TimerMode) => {
  const endsAt = Date.now() - 1000;

  return JSON.stringify({ phase: 'running', mode, startedAt: endsAt - 25 * MINUTE_IN_MS, endsAt });
};

/** 포그라운드에서 타이머가 완료된 화면 */
const renderCompletedInForeground = async (focusMinutes: number) => {
  const { result } = await renderHook(() => useTimerSession({ settingMinutes: { focus: focusMinutes, rest: 0 } }));

  await act(async () => mockRelease(null));
  await act(async () => result.current.play());

  const onFrame = requireFrameCallback();

  await act(async () => {
    onFrame({ timestamp: 0 });
    onFrame({ timestamp: focusMinutes * MINUTE_IN_MS });
  });

  return result;
};

/** 포그라운드에서 휴식 타이머가 완료된 화면. 휴식은 완료 단계를 거치지 않고 집중 대기로 돌아감 */
const renderRestCompletedInForeground = async (restMinutes: number) => {
  const { result } = await renderHook(() => useTimerSession({ settingMinutes: { focus: 25, rest: restMinutes } }));

  const now = Date.now();

  await act(async () => mockRelease(JSON.stringify({ phase: 'running', mode: 'rest', startedAt: now, endsAt: now + restMinutes * MINUTE_IN_MS })));

  const onFrame = requireFrameCallback();

  await act(async () => {
    onFrame({ timestamp: 0 });
    onFrame({ timestamp: restMinutes * MINUTE_IN_MS });
  });

  return result;
};

const renderCompleted = async (mode: TimerMode, settingMinutes: Record<TimerMode, number> = TIMER_DEFAULT) => {
  const { result } = await renderHook(() => useTimerSession({ settingMinutes }));

  await act(async () => mockRelease(storedCompleted(mode)));

  return result;
};

beforeEach(() => {
  // 지금 시각이 멈춰야 끝날 시각을 한 값으로 비교할 수 있음
  jest.useFakeTimers();

  mockWritten.length = 0;
  mockRemovedCount = 0;
  mockPatterns.length = 0;
  mockPending = null;
  mockAppState = 'active';
  mockAppStateListeners.length = 0;
  jest.mocked(AppState.addEventListener).mockImplementation((_type, listener) => {
    mockAppStateListeners.push(listener);

    return { remove: () => {} };
  });
  // 남겨 두면 이번 화면이 등록에 실패했을 때 지난 화면의 콜백을 부름
  mockOnFrame = null;
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

    expect(result.current.session).toEqual({ phase: 'paused', mode: 'rest', startedAt: NOW, pausedRemainingMs: 90_000 });
  });
});

describe('저장값 읽은 뒤 맞추기', () => {
  it('읽어 온 값이 이미 끝난 휴식 타이머면 저장값을 지운다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => mockRelease(storedCompleted('rest')));

    expect(result.current.session).toEqual(READY_SESSION);
    expect(mockRemovedCount).toBe(1);
  });
});

describe('완료 뒤 자동 시작', () => {
  it('집중 타이머가 끝나면 그 자리에서 휴식 진행이 된다', async () => {
    const result = await renderCompleted('focus');

    expect(result.current.session).toEqual({ phase: 'running', mode: 'rest', startedAt: Date.now(), endsAt: Date.now() + TIMER_DEFAULT.rest * MINUTE_IN_MS });
  });

  it('휴식 타이머가 0분이면 완료 연출이 도는 3499밀리초까지는 완료 그대로다', async () => {
    const result = await renderCompleted('focus', { focus: 25, rest: 0 });

    await act(async () => {
      jest.advanceTimersByTime(3499);
    });

    expect(result.current.session).toEqual({ phase: 'completed', mode: 'focus' });
  });

  it('휴식 타이머가 0분이면 완료 연출이 끝난 3500밀리초에 집중 타이머 대기가 된다', async () => {
    const result = await renderCompleted('focus', { focus: 25, rest: 0 });

    await act(async () => {
      jest.advanceTimersByTime(3500);
    });

    expect(result.current.session).toEqual(READY_SESSION);
  });

  it('휴식 타이머가 끝나면 집중 타이머 대기가 된다', async () => {
    const result = await renderCompleted('rest');

    expect(result.current.session).toEqual(READY_SESSION);
  });
});

describe('완료 진동', () => {
  it('집중 타이머가 끝나면 집중 패턴이 나간다', async () => {
    await renderCompletedInForeground(1);

    expect(mockPatterns).toEqual([COMPLETION_PATTERN.focus]);
  });

  it('휴식 타이머가 끝나면 휴식 패턴이 나간다', async () => {
    await renderRestCompletedInForeground(1);

    expect(mockPatterns).toEqual([COMPLETION_PATTERN.rest]);
  });

  it('앱 밖에서 끝난 것을 저장값으로 읽었을 때는 울리지 않는다', async () => {
    await renderCompleted('focus');

    expect(mockPatterns).toEqual([]);
  });

  it('제어센터가 덮은 상태에서 끝나면 울린다', async () => {
    mockAppState = 'inactive';

    await renderCompletedInForeground(1);

    expect(mockPatterns).toEqual([COMPLETION_PATTERN.focus]);
  });

  it('정지한 뒤 다시 재생해 끝나면 울린다', async () => {
    const { result } = await renderHook(() => useTimerSession({ settingMinutes: { focus: 1, rest: 0 } }));

    await act(async () => mockRelease(null));
    await act(async () => result.current.play());
    await act(async () => result.current.stop());
    await act(async () => result.current.play());

    const onFrame = requireFrameCallback();

    await act(async () => {
      onFrame({ timestamp: 0 });
      onFrame({ timestamp: MINUTE_IN_MS });
    });

    expect(mockPatterns).toEqual([COMPLETION_PATTERN.focus]);
  });

  it('휴식이 이어지는 설정에서도 집중 완료 진동은 한 번만 나간다', async () => {
    const { result } = await renderHook(() => useTimerSession({ settingMinutes: { focus: 1, rest: 5 } }));

    await act(async () => mockRelease(null));
    await act(async () => result.current.play());

    const onFrame = requireFrameCallback();

    await act(async () => {
      onFrame({ timestamp: 0 });
      onFrame({ timestamp: MINUTE_IN_MS });
    });

    expect(mockPatterns).toEqual([COMPLETION_PATTERN.focus]);
  });

  it('활성 전환보다 먼저 도착한 프레임이 완료를 만들면 울리지 않는다', async () => {
    const { result } = await renderHook(() => useTimerSession({ settingMinutes: { focus: 1, rest: 0 } }));

    await act(async () => mockRelease(null));
    await act(async () => result.current.play());

    const onFrame = requireFrameCallback();

    await act(async () => onFrame({ timestamp: 0 }));

    // 돌아오는 첫 프레임은 활성 전환보다 먼저 도착함
    mockAppState = 'background';

    await act(async () => onFrame({ timestamp: MINUTE_IN_MS }));

    expect(mockPatterns).toEqual([]);
  });

  it('완료와 정지가 같은 배치에 들어와도 울리지 않는다', async () => {
    const { result } = await renderHook(() => useTimerSession({ settingMinutes: { focus: 1, rest: 0 } }));

    await act(async () => mockRelease(null));
    await act(async () => result.current.play());

    const onFrame = requireFrameCallback();

    await act(async () => {
      onFrame({ timestamp: 0 });
      onFrame({ timestamp: MINUTE_IN_MS });
      result.current.stop();
    });

    expect(mockPatterns).toEqual([]);
  });

  it('완료 예약이 도착하기 전에 정지하면 울리지 않는다', async () => {
    const { result } = await renderHook(() => useTimerSession({ settingMinutes: { focus: 1, rest: 0 } }));

    await act(async () => mockRelease(null));
    await act(async () => result.current.play());

    const onFrame = requireFrameCallback();

    mockPending = [];

    await act(async () => {
      onFrame({ timestamp: 0 });
      onFrame({ timestamp: MINUTE_IN_MS });
    });
    await act(async () => result.current.stop());

    const pending = mockPending;

    mockPending = null;

    await act(async () => {
      for (const run of pending) run();
    });

    expect(mockPatterns).toEqual([]);
  });
});

describe('백그라운드 복귀', () => {
  it('돌아와 완료가 된 뒤에는 이어지는 프레임이 남은 분을 덮지 않는다', async () => {
    const { result } = await renderHook(() => useTimerSession({ settingMinutes: { focus: 1, rest: 0 } }));

    await act(async () => mockRelease(null));
    await act(async () => result.current.play());

    const onFrame = requireFrameCallback();

    await act(async () => onFrame({ timestamp: 0 }));

    jest.setSystemTime(Date.now() + 2 * MINUTE_IN_MS);

    await act(async () => {
      for (const listener of mockAppStateListeners) listener('active');
    });

    const settled = result.current.remainingMinutes.value;

    await act(async () => onFrame({ timestamp: 10 }));

    expect(result.current.remainingMinutes.value).toBe(settled);
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
  it('휴식 타이머가 0분이면 연출이 끝나기 전에 재생했을 때 집중 진행이 된다', async () => {
    const result = await renderCompleted('focus', { focus: 25, rest: 0 });

    await act(async () => result.current.play());

    expect(result.current.session).toEqual({
      phase: 'running',
      mode: 'focus',
      startedAt: Date.now(),
      endsAt: Date.now() + TIMER_DEFAULT.focus * MINUTE_IN_MS,
    });
  });
});

describe('남은 분 공유 값', () => {
  it('일시정지 저장값을 복구하면 남은 90초가 1.5분으로 담긴다', async () => {
    const { result } = await renderBeforeRead();

    await act(async () => mockRelease(STORED_PAUSED));

    expect(result.current.remainingMinutes.value).toBeCloseTo(1.5, 10);
  });
});
