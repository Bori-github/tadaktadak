import { describe, expect, it, jest, beforeEach, afterEach } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { useCompletedEffectStartedAt } from './ember';

import { MINUTE_IN_MS, pauseTimer, resumeTimer, type RunningSession, type TimerSession } from '@/entities/timer';

const REST_MS = 5 * MINUTE_IN_MS;

const restingFrom = (startedAt: number): RunningSession => ({ phase: 'running', mode: 'rest', startedAt, endsAt: startedAt + REST_MS });

const startedAt = async (session: TimerSession) =>
  renderHook(({ current }: { current: TimerSession }) => useCompletedEffectStartedAt(current), { initialProps: { current: session } });

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('불티를 노출하는 동안', () => {
  it('휴식이 막 시작되면 노출한다', async () => {
    const { result } = await startedAt(restingFrom(Date.now()));

    expect(result.current).not.toBeNull();
  });

  it('휴식이 시작되고 3500밀리초가 지나면 꺼진다', async () => {
    const { result } = await startedAt(restingFrom(Date.now()));

    await act(async () => {
      jest.advanceTimersByTime(3500);
    });

    expect(result.current).toBeNull();
  });

  it('집중 완료 단계에서는 노출한다', async () => {
    const { result } = await startedAt({ phase: 'completed', mode: 'focus', completedAt: Date.now() });

    expect(result.current).not.toBeNull();
  });

  it.each([
    { label: '방금', completedBeforeMs: 0 },
    { label: '1초 전에', completedBeforeMs: 1000 },
  ])('집중 타이머가 $label 끝났으면 그 시각을 담는다', async ({ completedBeforeMs }) => {
    const completedAt = Date.now() - completedBeforeMs;
    const { result } = await startedAt({ phase: 'completed', mode: 'focus', completedAt });

    expect(result.current).toBe(completedAt);
  });

  it('완료에서 휴식 타이머 진행으로 넘어가도 같은 값이다', async () => {
    const completedAt = Date.now();
    const { result, rerender } = await startedAt({ phase: 'completed', mode: 'focus', completedAt });
    const beforeHandoff = result.current;

    // 완료를 만든 프레임과 휴식 타이머를 시작하는 이펙트 사이에 시간이 흐름
    await act(async () => {
      jest.advanceTimersByTime(12);
      rerender({ current: { phase: 'running', mode: 'rest', startedAt: completedAt, endsAt: completedAt + REST_MS } });
    });

    expect(result.current).toBe(beforeHandoff);
  });
});

describe('일시정지했다 재개할 때', () => {
  it('멈춘 동안에는 노출하지 않는다', async () => {
    const resting = restingFrom(Date.now());
    const { result, rerender } = await startedAt(resting);

    await act(async () => rerender({ current: pauseTimer({ session: resting, now: Date.now() + 1000 }) }));

    expect(result.current).toBeNull();
  });

  it('창이 지난 뒤 재개하면 다시 노출하지 않는다', async () => {
    const resting = restingFrom(Date.now());
    const { result, rerender } = await startedAt(resting);

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
    const { result, rerender } = await startedAt(resting);

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
