import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useCompletedEffectElapsedMs } from './ember';

import { MINUTE_IN_MS, pauseTimer, resumeTimer, type RunningSession, type TimerSession } from '@/entities/timer';

const REST_MS = 5 * MINUTE_IN_MS;

const restingFrom = (startedAt: number): RunningSession => ({ phase: 'running', mode: 'rest', startedAt, endsAt: startedAt + REST_MS });

const elapsed = async (session: TimerSession) =>
  renderHook(({ current }: { current: TimerSession }) => useCompletedEffectElapsedMs(current), { initialProps: { current: session } });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('불티를 노출하는 동안', () => {
  it('휴식이 막 시작되면 노출한다', async () => {
    const { result } = await elapsed(restingFrom(Date.now()));

    expect(result.current).not.toBeNull();
  });

  it('휴식이 시작되고 3500밀리초가 지나면 꺼진다', async () => {
    const { result } = await elapsed(restingFrom(Date.now()));

    await act(async () => {
      jest.advanceTimersByTime(3500);
    });

    expect(result.current).toBeNull();
  });

  it('집중 완료 단계에서는 노출한다', async () => {
    const { result } = await elapsed({ phase: 'completed', mode: 'focus', completedAt: Date.now() });

    expect(result.current).not.toBeNull();
  });

  it.each([
    { label: '방금 끝났으면 0에서 시작한다', completedBeforeMs: 0, expected: 0 },
    { label: '1초 전에 끝났으면 1000에서 시작한다', completedBeforeMs: 1000, expected: 1000 },
  ])('집중이 $label', async ({ completedBeforeMs, expected }) => {
    const { result } = await elapsed({ phase: 'completed', mode: 'focus', completedAt: Date.now() - completedBeforeMs });

    expect(result.current).toBe(expected);
  });
});

describe('일시정지했다 재개할 때', () => {
  it('멈춘 동안에는 노출하지 않는다', async () => {
    const resting = restingFrom(Date.now());
    const { result, rerender } = await elapsed(resting);

    await act(async () => rerender({ current: pauseTimer({ session: resting, now: Date.now() + 1000 }) }));

    expect(result.current).toBeNull();
  });

  it('창이 지난 뒤 재개하면 다시 노출하지 않는다', async () => {
    const resting = restingFrom(Date.now());
    const { result, rerender } = await elapsed(resting);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const stopped = pauseTimer({ session: resting, now: Date.now() });
    await act(async () => rerender({ current: stopped }));

    await act(async () => {
      jest.advanceTimersByTime(60 * MINUTE_IN_MS);
    });
    await act(async () => rerender({ current: resumeTimer({ session: stopped, now: Date.now() }) }));

    expect(result.current).toBeNull();
  });

  it('창이 남은 채로 재개하면 남은 동안만 노출한다', async () => {
    const resting = restingFrom(Date.now());
    const { result, rerender } = await elapsed(resting);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    const stopped = pauseTimer({ session: resting, now: Date.now() });
    await act(async () => rerender({ current: stopped }));

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await act(async () => rerender({ current: resumeTimer({ session: stopped, now: Date.now() }) }));

    expect(result.current).not.toBeNull();

    await act(async () => {
      jest.advanceTimersByTime(1500);
    });

    expect(result.current).toBeNull();
  });
});
