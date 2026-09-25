import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { type useState } from 'react';
import { act, renderHook } from '@testing-library/react-native';

import { useDialDrag } from './drag';
import { pointOnDial } from '../lib/geometry';

import { type TimerMode } from '@/entities/timer';

// 제스처는 공유 값을 바뀌는 칸으로만 쓰고, 콜백은 UI 스레드를 거치지 않고 바로 부름
jest.mock('react-native-reanimated', () => ({
  // 리렌더링 간 같은 객체를 유지하도록 `useState`로 보관
  useSharedValue: (initial: unknown) => jest.requireActual<{ useState: typeof useState }>('react').useState(() => ({ value: initial }))[0],
}));
/** 배열이면 `scheduleOnRN` 콜백을 즉시 실행하지 않고 적재. JS 스레드 지연 재현용 */
let mockDeferred: (() => void)[] | null = null;

jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => {
    if (mockDeferred) mockDeferred.push(() => callback(...args));
    else callback(...args);
  },
}));

type AutoShutdownCall = 'hold' | 'release';

/** 진동을 재생한 횟수 */
let mockVibrations = 0;
const mockAutoShutdown: AutoShutdownCall[] = [];

jest.mock('@modules/haptic-pattern', () => ({
  hapticPattern: {
    play: () => {
      mockVibrations += 1;
    },
    holdAsync: async () => {
      mockAutoShutdown.push('hold');
    },
    release: () => {
      mockAutoShutdown.push('release');
    },
  },
}));

const CENTER_X = 200;
const CENTER_Y = 400;
const RADIUS = 100;
const DOT_SIZE = 4;
const START_MINUTES = 25;
const POINTER_ID = 1;

type Point = { x: number; y: number };
type Touch = Point & { id: number };
type TouchManager = { activate: () => void; fail: () => void };
type TouchHandler = (event: { changedTouches: Touch[]; allTouches: Touch[] }, manager: TouchManager) => void;
type TouchHandlers = { onTouchesDown: TouchHandler; onTouchesMove: TouchHandler; onFinalize: () => void };

/** 손잡이가 그 분을 가리킬 때의 시계판 좌표 */
const getDialPoint = (minutes: number): Point => pointOnDial(CENTER_X, CENTER_Y, RADIUS, minutes * 6);

type DragInput = {
  /** 손가락을 내려놓는 곳 */
  grabAt: Point;
  /** 차례로 지나가는 타이머 시간(분) */
  through: number[];
};

const buildTouch = (point: Point): Touch => ({ id: POINTER_ID, ...point });

const renderDrag = async () => {
  const onChange = jest.fn<(minutes: number) => void>();
  const onChangeEnd = jest.fn<(minutes: number) => void>();

  const { result, rerender, unmount } = await renderHook(
    ({ minutes, mode }: { minutes: number; mode: TimerMode }) =>
      useDialDrag({
        centerX: CENTER_X,
        centerY: CENTER_Y,
        radius: RADIUS,
        dotSize: DOT_SIZE,
        minutes,
        mode,
        enabled: true,
        onChange,
        onChangeEnd,
      }),
    { initialProps: { minutes: START_MINUTES, mode: 'focus' as TimerMode } },
  );

  // `fireGestureHandler`가 터치 이벤트를 내보내지 못해 제스처의 콜백을 직접 부름
  const handlers = result.current.gesture.handlers as unknown as TouchHandlers;
  const manager = { activate: jest.fn(), fail: jest.fn() };

  return { handlers, manager, result, rerender, unmount, onChange, onChangeEnd };
};

/** 한 번의 끌기를 끝까지 재생하고 두 콜백이 받은 것을 돌려줌 */
const drag = async ({ grabAt, through }: DragInput) => {
  const { handlers, manager, onChange, onChangeEnd } = await renderDrag();

  handlers.onTouchesDown({ changedTouches: [buildTouch(grabAt)], allTouches: [buildTouch(grabAt)] }, manager);
  for (const minutes of through) {
    const point = buildTouch(getDialPoint(minutes));
    handlers.onTouchesMove({ changedTouches: [point], allTouches: [point] }, manager);
  }
  await act(async () => {
    handlers.onFinalize();
  });

  return { onChange, onChangeEnd, manager };
};

beforeEach(() => {
  mockDeferred = null;
  mockVibrations = 0;
  mockAutoShutdown.length = 0;
});

describe('손잡이를 끌어 타이머 시간을 바꾸는 제스처', () => {
  it('눈금 세 개를 지나 끌면 세 번 바뀌고 저장은 마지막 값으로 한 번만 한다', async () => {
    const { onChange, onChangeEnd } = await drag({ grabAt: getDialPoint(START_MINUTES), through: [26, 27, 28] });

    expect(onChange.mock.calls.map(([minutes]) => minutes)).toEqual([26, 27, 28]);
    expect(onChangeEnd.mock.calls).toEqual([[28]]);
  });

  it('손잡이를 잡았다가 움직이지 않고 떼면 저장하지 않는다', async () => {
    const { onChange, onChangeEnd } = await drag({ grabAt: getDialPoint(START_MINUTES), through: [] });

    expect(onChange).not.toHaveBeenCalled();
    expect(onChangeEnd).not.toHaveBeenCalled();
  });

  it('같은 눈금에 머무는 동안에는 진동하지 않고 눈금을 넘을 때마다 한 번씩 진동한다', async () => {
    await drag({ grabAt: getDialPoint(START_MINUTES), through: [26, 26, 27] });

    expect(mockVibrations).toBe(2);
  });

  it('손잡이를 잡으면 자동 종료를 막고 뗄 때 되돌린다', async () => {
    await drag({ grabAt: getDialPoint(START_MINUTES), through: [26] });

    expect(mockAutoShutdown).toEqual(['hold', 'release']);
  });

  it('손잡이 밖을 잡으면 끌어도 타이머 시간이 바뀌지 않는다', async () => {
    const { onChange, onChangeEnd, manager } = await drag({ grabAt: getDialPoint(START_MINUTES + 15), through: [26, 27, 28] });

    expect(manager.fail).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(onChangeEnd).not.toHaveBeenCalled();
  });

  it('끌기 도중 화면이 사라져도 자동 종료를 되돌린다', async () => {
    const { handlers, manager, unmount } = await renderDrag();
    const grab = buildTouch(getDialPoint(START_MINUTES));

    // 화면이 사라지면 제스처가 버려져 `onFinalize`가 호출되지 않음
    handlers.onTouchesDown({ changedTouches: [grab], allTouches: [grab] }, manager);
    await act(async () => {
      unmount();
    });

    expect(mockAutoShutdown).toEqual(['hold', 'release']);
  });

  it('끌기 도중 손가락을 하나 더 대도 자동 종료를 거듭 막지 않는다', async () => {
    const { handlers, manager } = await renderDrag();
    const grab = buildTouch(getDialPoint(START_MINUTES));
    const second = { id: POINTER_ID + 1, ...getDialPoint(START_MINUTES) };

    handlers.onTouchesDown({ changedTouches: [grab], allTouches: [grab] }, manager);
    handlers.onTouchesDown({ changedTouches: [second], allTouches: [grab, second] }, manager);
    await act(async () => {
      handlers.onFinalize();
    });

    expect(mockAutoShutdown).toEqual(['hold', 'release']);
  });

  it('손잡이 밖을 잡으면 자동 종료를 건드리지 않는다', async () => {
    await drag({ grabAt: getDialPoint(START_MINUTES + 15), through: [26, 27] });

    expect(mockAutoShutdown).toEqual([]);
  });
});

describe('useDialDrag의 draggedMinutes·isShowingDragged 상태', () => {
  const grab = buildTouch(getDialPoint(START_MINUTES));

  it('손잡이를 잡으면 isShowingDragged가 true가 되고 draggedMinutes가 터치 위치의 스냅된 시간으로 갱신된다', async () => {
    const { handlers, manager, result } = await renderDrag();
    const moved = buildTouch(getDialPoint(28));

    handlers.onTouchesDown({ changedTouches: [grab], allTouches: [grab] }, manager);
    handlers.onTouchesMove({ changedTouches: [moved], allTouches: [moved] }, manager);

    expect(result.current.isShowingDragged.value).toBe(true);
    expect(result.current.draggedMinutes.value).toBe(28);
  });

  it('손잡이 밖을 잡으면 isShowingDragged가 false로 유지된다', async () => {
    const { handlers, manager, result } = await renderDrag();
    const outside = buildTouch(getDialPoint(START_MINUTES + 15));

    handlers.onTouchesDown({ changedTouches: [outside], allTouches: [outside] }, manager);

    expect(result.current.isShowingDragged.value).toBe(false);
  });

  it('onFinalize 후 onChangeEnd 다음 settle이 커밋되면 isShowingDragged를 해제한다', async () => {
    const { handlers, manager, result, onChangeEnd } = await renderDrag();
    const moved = buildTouch(getDialPoint(28));
    mockDeferred = [];

    handlers.onTouchesDown({ changedTouches: [grab], allTouches: [grab] }, manager);
    handlers.onTouchesMove({ changedTouches: [moved], allTouches: [moved] }, manager);
    handlers.onFinalize();

    expect(result.current.isShowingDragged.value).toBe(true);

    await act(async () => {
      mockDeferred?.forEach((run) => {
        run();
      });
    });

    expect(onChangeEnd.mock.calls).toEqual([[28]]);
    expect(result.current.isShowingDragged.value).toBe(false);
  });

  it('settle 커밋 전 다시 잡으면 draggedMinutes 좌표로 히트 테스트한다', async () => {
    const { handlers, manager, result } = await renderDrag();
    const regrab = buildTouch(getDialPoint(35));
    mockDeferred = [];

    handlers.onTouchesDown({ changedTouches: [grab], allTouches: [grab] }, manager);
    for (const minutes of [28, 31, 35]) {
      const point = buildTouch(getDialPoint(minutes));
      handlers.onTouchesMove({ changedTouches: [point], allTouches: [point] }, manager);
    }
    handlers.onFinalize();
    handlers.onTouchesDown({ changedTouches: [regrab], allTouches: [regrab] }, manager);

    expect(manager.fail).not.toHaveBeenCalled();
    expect(result.current.draggedMinutes.value).toBe(35);
  });

  it('이전 드래그의 settle이 새 드래그 중 커밋되면 isShowingDragged를 유지한다', async () => {
    const { handlers, manager, result } = await renderDrag();
    const regrab = buildTouch(getDialPoint(28));
    mockDeferred = [];

    handlers.onTouchesDown({ changedTouches: [grab], allTouches: [grab] }, manager);
    handlers.onTouchesMove({ changedTouches: [regrab], allTouches: [regrab] }, manager);
    handlers.onFinalize();
    handlers.onTouchesDown({ changedTouches: [regrab], allTouches: [regrab] }, manager);
    await act(async () => {
      mockDeferred?.forEach((run) => {
        run();
      });
    });

    expect(result.current.isShowingDragged.value).toBe(true);
  });
});
