import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useEmberShown } from './ember';

import { MINUTE_IN_MS, pauseTimer, resumeTimer, type RunningSession, type TimerSession } from '@/entities/timer';

const REST_MS = 5 * MINUTE_IN_MS;

const restingFrom = (startedAt: number): RunningSession => ({ phase: 'running', mode: 'rest', startedAt, endsAt: startedAt + REST_MS });

const shown = async (session: TimerSession) => renderHook(({ current }: { current: TimerSession }) => useEmberShown(current), { initialProps: { current: session } });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('불티를 노출하는 동안', () => {
  it('휴식이 막 시작되면 노출한다', async () => {
    const { result } = await shown(restingFrom(Date.now()));

    expect(result.current).toBe(true);
  });

  it('휴식이 시작되고 3500밀리초가 지나면 꺼진다', async () => {
    const { result } = await shown(restingFrom(Date.now()));

    await act(async () => {
      jest.advanceTimersByTime(3500);
    });

    expect(result.current).toBe(false);
  });

  it('집중 완료 단계에서는 노출한다', async () => {
    const { result } = await shown({ phase: 'completed', mode: 'focus' });

    expect(result.current).toBe(true);
  });
});

describe('일시정지했다 재개할 때', () => {
  it('멈춘 동안에는 노출하지 않는다', async () => {
    const resting = restingFrom(Date.now());
    const { result, rerender } = await shown(resting);

    await act(async () => rerender({ current: pauseTimer({ session: resting, now: Date.now() + 1000 }) }));

    expect(result.current).toBe(false);
  });

  it('창이 지난 뒤 재개하면 다시 노출하지 않는다', async () => {
    const resting = restingFrom(Date.now());
    const { result, rerender } = await shown(resting);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const stopped = pauseTimer({ session: resting, now: Date.now() });
    await act(async () => rerender({ current: stopped }));

    await act(async () => {
      jest.advanceTimersByTime(60 * MINUTE_IN_MS);
    });
    await act(async () => rerender({ current: resumeTimer({ session: stopped, now: Date.now() }) }));

    expect(result.current).toBe(false);
  });

  it('창이 남은 채로 재개하면 남은 동안만 노출한다', async () => {
    const resting = restingFrom(Date.now());
    const { result, rerender } = await shown(resting);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const stopped = pauseTimer({ session: resting, now: Date.now() });
    await act(async () => rerender({ current: stopped }));

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => rerender({ current: resumeTimer({ session: stopped, now: Date.now() }) }));

    expect(result.current).toBe(true);

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current).toBe(false);
  });
});
