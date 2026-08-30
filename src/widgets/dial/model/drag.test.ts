import { describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react-native';

import { useDialDrag } from './drag';
import { pointOnDial } from '../lib/geometry';

// 제스처는 공유 값을 바뀌는 칸으로만 쓰고, 콜백은 UI 스레드를 거치지 않고 바로 부름
jest.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: unknown) => ({ value: initial }),
}));
jest.mock('react-native-worklets', () => ({
  scheduleOnRN: (callback: (...args: unknown[]) => void, ...args: unknown[]) => callback(...args),
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

/** 한 번의 끌기를 끝까지 재생하고 두 콜백이 받은 것을 돌려줌 */
const drag = async ({ grabAt, through }: DragInput) => {
  const onChange = jest.fn<(minutes: number) => void>();
  const onChangeEnd = jest.fn<(minutes: number) => void>();

  const { result } = await renderHook(() =>
    useDialDrag({
      centerX: CENTER_X,
      centerY: CENTER_Y,
      radius: RADIUS,
      dotSize: DOT_SIZE,
      minutes: START_MINUTES,
      mode: 'focus',
      enabled: true,
      onChange,
      onChangeEnd,
    }),
  );

  // `fireGestureHandler`가 터치 이벤트를 내보내지 못해 제스처의 콜백을 직접 부름
  const handlers = result.current.handlers as unknown as TouchHandlers;
  const manager = { activate: jest.fn(), fail: jest.fn() };
  const buildTouch = (point: Point): Touch => ({ id: POINTER_ID, ...point });

  handlers.onTouchesDown({ changedTouches: [buildTouch(grabAt)], allTouches: [buildTouch(grabAt)] }, manager);
  for (const minutes of through) {
    const point = buildTouch(getDialPoint(minutes));
    handlers.onTouchesMove({ changedTouches: [point], allTouches: [point] }, manager);
  }
  handlers.onFinalize();

  return { onChange, onChangeEnd, manager };
};

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

  it('손잡이 밖을 잡으면 끌어도 타이머 시간이 바뀌지 않는다', async () => {
    const { onChange, onChangeEnd, manager } = await drag({ grabAt: getDialPoint(START_MINUTES + 15), through: [26, 27, 28] });

    expect(manager.fail).toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    expect(onChangeEnd).not.toHaveBeenCalled();
  });
});
